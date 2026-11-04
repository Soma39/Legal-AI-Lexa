import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models import (
    User, LegalDocument, DocumentChunk, UserFeedback, AuditLog,
    Conversation, GeneratedDocument
)
from app.schemas import (
    UserResponse, LegalDocumentResponse, UserFeedbackResponse,
    AuditLogResponse
)
from app.api.deps import get_current_admin, sanitize_input, check_rate_limit
from app.services.rag.vector_store import vector_store

router = APIRouter(prefix="/admin", tags=["Administrator Dashboard"], dependencies=[Depends(check_rate_limit)])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all registered users (Admin only)."""
    return db.query(User).offset(skip).limit(limit).all()


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    new_role: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Change role of a user (e.g., 'user', 'admin', 'legal_researcher')."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = user.role
    user.role = new_role
    if new_role == "admin":
        user.is_superuser = True
    else:
        user.is_superuser = False

    audit = AuditLog(
        user_id=admin.id,
        action="UPDATE_USER_ROLE",
        resource_type="User",
        resource_id=user.id,
        details_json={"old_role": old_role, "new_role": new_role}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user


@router.get("/documents", response_model=List[LegalDocumentResponse])
def list_documents(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all legal documents in the knowledge base and their ingestion status."""
    return db.query(LegalDocument).order_by(LegalDocument.created_at.desc()).all()


@router.post("/documents/upload", response_model=LegalDocumentResponse)
async def upload_document(
    title: str = Form(...),
    document_type: str = Form("Act"),
    jurisdiction: str = Form("India"),
    publication_date: Optional[str] = Form(None),
    effective_date: Optional[str] = Form(None),
    amendment_status: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Upload and ingest a verified legal statute or notification (PDF or TXT).
    Extracts text, creates chunks, updates vector store.
    """
    clean_title = sanitize_input(title)
    filename = file.filename or "uploaded_doc.txt"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Only .pdf and .txt files are permitted.")

    # Save file
    file_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    if file_size > 15 * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="File size exceeds maximum 15MB limit.")

    # Extract text
    text_content = ""
    try:
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
        elif ext == ".pdf":
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                text_content += (page.extract_text() or "") + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Extracted text is empty or unreadable.")

    # Save doc in db
    doc = LegalDocument(
        title=clean_title,
        document_type=sanitize_input(document_type),
        jurisdiction=sanitize_input(jurisdiction),
        publication_date=publication_date,
        effective_date=effective_date,
        amendment_status=sanitize_input(amendment_status),
        source_url=source_url,
        file_path=file_path,
        file_size=file_size,
        ingestion_status="indexed"
    )
    db.add(doc)
    db.flush()

    # Create chunking (500 words per chunk with 50 words overlap)
    words = text_content.split()
    chunk_size = 400
    overlap = 50
    chunks_to_index = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk_text = " ".join(words[i:i + chunk_size])
        if not chunk_text.strip():
            continue

        chunk_idx = i // (chunk_size - overlap)
        chunk_obj = DocumentChunk(
            document_id=doc.id,
            chunk_index=chunk_idx,
            content=chunk_text,
            metadata_json={
                "statute_name": doc.title,
                "section": f"Section/Clause {chunk_idx + 1}",
                "document_title": doc.title,
                "source_url": doc.source_url,
                "effective_date": doc.effective_date,
                "amendment_status": doc.amendment_status
            },
            token_count=len(chunk_text.split())
        )
        db.add(chunk_obj)
        db.flush()

        chunks_to_index.append({
            "id": chunk_obj.id,
            "document_id": doc.id,
            "title": doc.title,
            "statute": doc.title,
            "section": f"Section/Clause {chunk_idx + 1}",
            "content": f"{doc.title} - {chunk_text}",
            "source_url": doc.source_url,
            "effective_date": doc.effective_date,
            "amendment_status": doc.amendment_status
        })

    db.commit()

    # Index in vector store
    vector_store.add_chunks(chunks_to_index, save=True)

    audit = AuditLog(
        user_id=admin.id,
        action="DOCUMENT_INGEST",
        resource_type="LegalDocument",
        resource_id=doc.id,
        details_json={"title": doc.title, "chunks_count": len(chunks_to_index)}
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Remove a legal document and its chunks from DB and vector index."""
    doc = db.query(LegalDocument).filter(LegalDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    vector_store.remove_document_chunks(document_id)
    db.delete(doc)

    audit = AuditLog(
        user_id=admin.id,
        action="DOCUMENT_DELETE",
        resource_type="LegalDocument",
        resource_id=document_id,
        details_json={"title": doc.title}
    )
    db.add(audit)
    db.commit()
    return None


@router.get("/feedback", response_model=List[UserFeedbackResponse])
def get_all_feedback(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """View user feedback on responses and citation accuracy (Admin only)."""
    return db.query(UserFeedback).order_by(UserFeedback.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """View security and administrative audit trails."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/system-stats")
def get_system_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """High-level usage metrics for administrative monitoring."""
    total_users = db.query(User).count()
    total_conversations = db.query(Conversation).count()
    total_drafts = db.query(GeneratedDocument).count()
    total_documents = db.query(LegalDocument).count()
    total_chunks = db.query(DocumentChunk).count()
    total_feedback = db.query(UserFeedback).count()
    positive_feedback = db.query(UserFeedback).filter(UserFeedback.is_helpful == True).count()
    accurate_citations = db.query(UserFeedback).filter(UserFeedback.citation_accurate == True).count()

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_drafts": total_drafts,
        "total_legal_documents": total_documents,
        "total_indexed_chunks": total_chunks,
        "vector_store_chunks_count": vector_store.get_chunk_count(),
        "total_feedback_count": total_feedback,
        "positive_feedback_ratio": round(positive_feedback / total_feedback, 2) if total_feedback > 0 else 1.0,
        "citation_accuracy_ratio": round(accurate_citations / total_feedback, 2) if total_feedback > 0 else 1.0,
        "llm_provider": settings.LLM_PROVIDER,
        "environment": settings.ENVIRONMENT
    }
