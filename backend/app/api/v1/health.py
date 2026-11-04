from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.schemas import HealthCheckResponse
from app.models import LegalDocument
from app.services.rag.vector_store import vector_store

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    """System health check endpoint verifying database, vector store, and configuration."""
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    doc_count = 0
    try:
        doc_count = db.query(LegalDocument).count()
    except Exception:
        pass

    vector_ready = vector_store.get_chunk_count() > 0

    return HealthCheckResponse(
        status="healthy" if db_ok else "degraded",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_connected=db_ok,
        llm_provider=settings.LLM_PROVIDER,
        indexed_documents_count=doc_count,
        vector_store_ready=vector_ready
    )
