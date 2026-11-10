from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Conversation, Message, SourceCitation, User
from app.schemas import (
    ConversationCreate, ConversationResponse, ConversationUpdate,
    MessageCreate, MessageResponse
)
from app.api.deps import get_current_user, sanitize_input, check_rate_limit
from app.services.rag.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["AI Legal Chatbot"], dependencies=[Depends(check_rate_limit)])


@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all conversations belonging to the authenticated user."""
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc()).all()


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new chat conversation."""
    conv = Conversation(
        user_id=current_user.id,
        title=sanitize_input(conv_in.title) or "New Legal Inquiry",
        topic=sanitize_input(conv_in.topic) or "General Law",
        jurisdiction=sanitize_input(conv_in.jurisdiction) or "India"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific conversation with all historical messages and citations."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    conv_update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename or pin/unpin a conversation."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv_update.title is not None:
        conv.title = sanitize_input(conv_update.title)
    if conv_update.topic is not None:
        conv.topic = sanitize_input(conv_update.topic)
    if conv_update.is_pinned is not None:
        conv.is_pinned = conv_update.is_pinned

    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its associated messages."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    db.delete(conv)
    db.commit()
    return None


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a natural language legal inquiry.
    Executes RAG pipeline against verified Indian legal corpus, saves user message
    and assistant reply with citations.
    """
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    clean_content = sanitize_input(msg_in.content)
    jurisdiction = sanitize_input(msg_in.jurisdiction) or conv.jurisdiction or "India"

    # 1. Fetch preceding conversational history for multi-turn dialogue context
    prior_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(6)
        .all()
    )
    prior_messages.reverse()
    conversation_context = [
        {"role": "user" if m.sender == "user" else "assistant", "content": m.content}
        for m in prior_messages
    ]

    # 2. Save user question message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=clean_content,
        detected_jurisdiction=jurisdiction
    )
    db.add(user_msg)
    db.flush()

    # 3. Run RAG Pipeline with conversational memory
    rag_result = await rag_service.answer_question(
        query=clean_content,
        jurisdiction=jurisdiction,
        conversation_context=conversation_context
    )

    # Auto-update conversation title if still default
    if conv.title == "New Legal Inquiry" and len(clean_content) > 3:
        short_title = clean_content[:45] + ("..." if len(clean_content) > 45 else "")
        conv.title = short_title
    if rag_result.get("topic") and conv.topic == "General Law":
        conv.topic = rag_result["topic"]

    # 3. Save assistant reply message
    assistant_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=rag_result["answer"],
        disclaimer=rag_result.get("disclaimer"),
        confidence_score=rag_result.get("confidence_score"),
        intent=rag_result.get("intent"),
        detected_jurisdiction=rag_result.get("detected_jurisdiction")
    )
    db.add(assistant_msg)
    db.flush()

    # 4. Save Citations linked strictly to the assistant message
    for cit in rag_result.get("citations", []):
        citation = SourceCitation(
            message_id=assistant_msg.id,
            document_title=cit["document_title"],
            section_or_article=cit.get("section_or_article"),
            statute_name=cit["statute_name"],
            source_url=cit.get("source_url"),
            exact_quote=cit.get("exact_quote"),
            relevance_score=cit.get("relevance_score", 1.0)
        )
        db.add(citation)

    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
