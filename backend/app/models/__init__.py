import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Float, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    LEGAL_RESEARCHER = "legal_researcher"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("UserFeedback", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    privacy_preference = relationship("UserPrivacyPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Legal Inquiry")
    topic = Column(String(100), default="General Law", nullable=False)
    jurisdiction = Column(String(100), default="India", nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    disclaimer = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    intent = Column(String(100), nullable=True)
    detected_jurisdiction = Column(String(100), default="India", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    citations = relationship("SourceCitation", back_populates="message", cascade="all, delete-orphan")
    feedback = relationship("UserFeedback", back_populates="message", cascade="all, delete-orphan")


class SourceCitation(Base):
    __tablename__ = "source_citations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    document_title = Column(String(255), nullable=False)
    section_or_article = Column(String(100), nullable=True)
    statute_name = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    page_number = Column(Integer, nullable=True)
    exact_quote = Column(Text, nullable=True)
    relevance_score = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    message = relationship("Message", back_populates="citations")


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False, default="Act")  # Act, Rule, Judgment, Notification
    jurisdiction = Column(String(100), nullable=False, default="India")
    publication_date = Column(String(50), nullable=True)
    effective_date = Column(String(50), nullable=True)
    amendment_status = Column(String(100), nullable=True)  # e.g., "Enacted 2023, Replaces IPC 1860"
    source_url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, default=0)
    ingestion_status = Column(String(50), default="indexed", nullable=False)  # pending, indexed, failed
    version = Column(String(20), default="1.0", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("legal_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    document = relationship("LegalDocument", back_populates="chunks")


class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    purpose_and_limitations = Column(Text, nullable=False)
    schema_json = Column(JSON, nullable=False)  # Pydantic/Form field definitions
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    drafts = relationship("GeneratedDocument", back_populates="template")


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String(36), ForeignKey("document_templates.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False)
    input_data_json = Column(JSON, default=dict, nullable=False)
    generated_content = Column(Text, nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # draft, finalized
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="generated_documents")
    template = relationship("DocumentTemplate", back_populates="drafts")


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    is_helpful = Column(Boolean, nullable=False)
    rating = Column(Integer, nullable=True)
    comments = Column(Text, nullable=True)
    citation_accurate = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="feedback")
    message = relationship("Message", back_populates="feedback")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # e.g., "LOGIN", "EXPORT_DATA", "DELETE_ACCOUNT", "GENERATE_DOC"
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="audit_logs")


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_name = Column(String(255), index=True, nullable=False)
    entity_type = Column(String(50), nullable=False)  # "Act", "Section", "Topic", "Concept", "Court", "Remedy"
    statute_name = Column(String(255), nullable=True)
    section_number = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False)  # "REPLACES", "REFERENCES", "PRESCRIBES", "AMENDS", "DEFINES"
    description = Column(Text, nullable=True)
    verified_source = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class UserPrivacyPreference(Base):
    __tablename__ = "user_privacy_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    consent_data_retention = Column(Boolean, default=True, nullable=False)
    consent_personalization = Column(Boolean, default=True, nullable=False)
    analytics_opt_in = Column(Boolean, default=False, nullable=False)
    retention_days = Column(Integer, default=90, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="privacy_preference")
