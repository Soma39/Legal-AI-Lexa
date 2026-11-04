from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import DocumentSearchResult
from app.api.deps import check_rate_limit, sanitize_input
from app.services.rag.vector_store import vector_store
from app.services.rag.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["Legal Search & Retrieval"], dependencies=[Depends(check_rate_limit)])


@router.get("/search", response_model=List[DocumentSearchResult])
def search_legal_corpus(
    q: str = Query(..., min_length=2, description="Legal search term, statute, or section"),
    limit: int = Query(5, ge=1, le=20),
    statute: Optional[str] = Query(None, description="Optional statute filter (e.g., 'BNS', 'BNSS', 'Consumer')")
):
    """
    Search indexed Indian legal corpus using semantic cosine similarity and keyword matching.
    Returns matched sections with provenance.
    """
    clean_query = sanitize_input(q)
    results = vector_store.search(
        query=clean_query,
        top_k=limit,
        min_score=0.04,
        statute_filter=statute
    )

    formatted = []
    for r in results:
        formatted.append(DocumentSearchResult(
            document_id=r.get("document_id", ""),
            title=r.get("title", ""),
            statute_name=r.get("statute", ""),
            section=r.get("section"),
            snippet=r.get("content", ""),
            source_url=r.get("source_url"),
            relevance_score=r.get("score", 1.0),
            effective_date=r.get("effective_date"),
            amendment_status=r.get("amendment_status")
        ))
    return formatted


@router.post("/ask-direct")
async def ask_direct_question(
    q: str = Query(..., min_length=2),
    jurisdiction: str = Query("India")
):
    """
    Direct one-shot legal Q&A endpoint for dashboard and landing search box.
    Returns cited legal breakdown without requiring an existing conversation thread.
    """
    clean_query = sanitize_input(q)
    return await rag_service.answer_question(query=clean_query, jurisdiction=jurisdiction)
