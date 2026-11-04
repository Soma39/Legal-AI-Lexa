import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import DocumentTemplate, GeneratedDocument, User, AuditLog
from app.schemas import (
    DocumentTemplateResponse, GeneratedDocumentCreate, GeneratedDocumentResponse,
    GeneratedDocumentUpdate
)
from app.api.deps import get_current_user, sanitize_input, check_rate_limit
from app.services.document_generation.templates import TEMPLATE_FORMATTERS
from app.services.document_generation.docx_generator import generate_docx
from app.services.document_generation.pdf_generator import generate_pdf

router = APIRouter(prefix="/documents", tags=["Legal Document Drafting"], dependencies=[Depends(check_rate_limit)])


@router.get("/templates", response_model=List[DocumentTemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    """List all available legal drafting templates."""
    return db.query(DocumentTemplate).filter(DocumentTemplate.is_active == True).all()


@router.get("/templates/{template_code}", response_model=DocumentTemplateResponse)
def get_template_by_code(template_code: str, db: Session = Depends(get_db)):
    """Get field schema, purpose, and limitations for a specific template."""
    tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.code == template_code).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found.")
    return tmpl


@router.post("/drafts", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
def generate_draft(
    draft_in: GeneratedDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a legal document draft from a template schema.
    Validates fields, formats text, saves metadata, and produces initial files.
    """
    tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.code == draft_in.template_code).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail=f"Template '{draft_in.template_code}' not found.")

    formatter = TEMPLATE_FORMATTERS.get(draft_in.template_code)
    if not formatter:
        raise HTTPException(status_code=400, detail="Formatter for this template is unavailable.")

    # Format content
    content = formatter(draft_in.input_data)

    clean_title = sanitize_input(draft_in.title) or tmpl.name

    draft = GeneratedDocument(
        user_id=current_user.id,
        template_id=tmpl.id,
        title=clean_title,
        document_type=tmpl.name,
        input_data_json=draft_in.input_data,
        generated_content=content,
        status="draft"
    )
    db.add(draft)
    db.flush()

    # Pre-generate DOCX and PDF artifacts
    try:
        generate_docx(draft.id, draft.title, content)
        generate_pdf(draft.id, draft.title, content)
    except Exception as e:
        # Don't fail draft creation if rendering had a non-fatal warning
        pass

    audit = AuditLog(
        user_id=current_user.id,
        action="GENERATE_DRAFT",
        resource_type="GeneratedDocument",
        resource_id=draft.id,
        details_json={"template_code": draft_in.template_code, "title": draft.title}
    )
    db.add(audit)
    db.commit()
    db.refresh(draft)
    return draft


@router.get("/drafts", response_model=List[GeneratedDocumentResponse])
def get_user_drafts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all saved drafts for the authenticated user."""
    return db.query(GeneratedDocument).filter(
        GeneratedDocument.user_id == current_user.id
    ).order_by(GeneratedDocument.updated_at.desc()).all()


@router.get("/drafts/{draft_id}", response_model=GeneratedDocumentResponse)
def get_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reopen a saved draft for viewing or editing."""
    draft = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == draft_id,
        GeneratedDocument.user_id == current_user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")
    return draft


@router.put("/drafts/{draft_id}", response_model=GeneratedDocumentResponse)
def update_draft(
    draft_id: str,
    draft_update: GeneratedDocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update title or content of an editable draft."""
    draft = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == draft_id,
        GeneratedDocument.user_id == current_user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    if draft_update.title is not None:
        draft.title = sanitize_input(draft_update.title)
    if draft_update.generated_content is not None:
        draft.generated_content = draft_update.generated_content
        # Regenerate files
        try:
            generate_docx(draft.id, draft.title, draft.generated_content)
            generate_pdf(draft.id, draft.title, draft.generated_content)
        except Exception:
            pass
    if draft_update.status is not None:
        draft.status = draft_update.status

    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


@router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved draft."""
    draft = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == draft_id,
        GeneratedDocument.user_id == current_user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    db.delete(draft)
    db.commit()
    return None


@router.get("/drafts/{draft_id}/download/docx")
def download_docx(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download editable Microsoft Word DOCX draft."""
    draft = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == draft_id,
        GeneratedDocument.user_id == current_user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    file_path = generate_docx(draft.id, draft.title, draft.generated_content)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Could not generate DOCX file.")

    filename = f"{draft.title.replace(' ', '_')}.docx"
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )


@router.get("/drafts/{draft_id}/download/pdf")
def download_pdf(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download clean, printable PDF draft."""
    draft = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == draft_id,
        GeneratedDocument.user_id == current_user.id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    file_path = generate_pdf(draft.id, draft.title, draft.generated_content)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Could not generate PDF file.")

    filename = f"{draft.title.replace(' ', '_')}.pdf"
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )
