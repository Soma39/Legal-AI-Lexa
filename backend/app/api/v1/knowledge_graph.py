from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import KnowledgeNode, KnowledgeEdge
from app.schemas import KnowledgeGraphResponse, KnowledgeNodeResponse, KnowledgeEdgeResponse
from app.api.deps import check_rate_limit, sanitize_input

router = APIRouter(prefix="/graph", tags=["Legal Knowledge Graph"], dependencies=[Depends(check_rate_limit)])


@router.get("", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(
    entity_type: Optional[str] = Query(None, description="Filter by node type: 'Act', 'Section', 'Topic'"),
    search: Optional[str] = Query(None, description="Search term for node names"),
    db: Session = Depends(get_db)
):
    """
    Retrieve nodes and relationship edges for the interactive legal knowledge graph.
    All edges are traceable to authoritative statutory acts and official gazettes.
    """
    node_query = db.query(KnowledgeNode)
    if entity_type:
        node_query = node_query.filter(KnowledgeNode.entity_type == entity_type)
    if search:
        clean_search = sanitize_input(search)
        node_query = node_query.filter(KnowledgeNode.entity_name.ilike(f"%{clean_search}%"))

    nodes = node_query.all()
    node_ids = {n.id for n in nodes}

    # Retrieve edges connecting these nodes
    if node_ids:
        edges = db.query(KnowledgeEdge).filter(
            (KnowledgeEdge.source_node_id.in_(node_ids)) &
            (KnowledgeEdge.target_node_id.in_(node_ids))
        ).all()
    else:
        edges = []

    return KnowledgeGraphResponse(
        nodes=[KnowledgeNodeResponse.model_validate(n) for n in nodes],
        edges=[KnowledgeEdgeResponse.model_validate(e) for e in edges]
    )


@router.get("/entity/{node_id}", response_model=KnowledgeNodeResponse)
def get_node_details(node_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed metadata, section numbers, and source provenance for a specific legal node."""
    node = db.query(KnowledgeNode).filter(KnowledgeNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Entity node not found in knowledge graph.")
    return node
