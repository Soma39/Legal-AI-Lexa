from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==================== Auth & User Schemas ====================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(..., min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


# ==================== Citation & Chat Schemas ====================
class SourceCitationResponse(BaseModel):
    id: str
    document_title: str
    section_or_article: Optional[str] = None
    statute_name: str
    source_url: Optional[str] = None
    page_number: Optional[int] = None
    exact_quote: Optional[str] = None
    relevance_score: float

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    jurisdiction: Optional[str] = "India"


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    disclaimer: Optional[str] = None
    confidence_score: Optional[float] = None
    intent: Optional[str] = None
    detected_jurisdiction: Optional[str] = "India"
    citations: List[SourceCitationResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Legal Inquiry"
    topic: Optional[str] = "General Law"
    jurisdiction: Optional[str] = "India"


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    is_pinned: Optional[bool] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    topic: str
    jurisdiction: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Legal Document & Search Schemas ====================
class LegalDocumentCreate(BaseModel):
    title: str
    document_type: str = "Act"
    jurisdiction: str = "India"
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    amendment_status: Optional[str] = None
    source_url: Optional[str] = None
    content: Optional[str] = None


class LegalDocumentResponse(BaseModel):
    id: str
    title: str
    document_type: str
    jurisdiction: str
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    amendment_status: Optional[str] = None
    source_url: Optional[str] = None
    file_size: int
    ingestion_status: str
    version: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    limit: int = Field(5, ge=1, le=20)
    document_type: Optional[str] = None
    jurisdiction: Optional[str] = "India"


class DocumentSearchResult(BaseModel):
    document_id: str
    title: str
    statute_name: str
    section: Optional[str] = None
    snippet: str
    source_url: Optional[str] = None
    relevance_score: float
    effective_date: Optional[str] = None
    amendment_status: Optional[str] = None


# ==================== Document Generation Schemas ====================
class DocumentTemplateResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str
    category: str
    purpose_and_limitations: str
    form_schema: Dict[str, Any] = Field(default_factory=dict, alias="schema_json")
    is_active: bool

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class GeneratedDocumentCreate(BaseModel):
    template_code: str
    title: str
    input_data: Dict[str, Any]


class GeneratedDocumentUpdate(BaseModel):
    title: Optional[str] = None
    generated_content: Optional[str] = None
    status: Optional[str] = None


class GeneratedDocumentResponse(BaseModel):
    id: str
    user_id: str
    template_id: Optional[str] = None
    title: str
    document_type: str
    input_data_json: Dict[str, Any]
    generated_content: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Knowledge Graph Schemas ====================
class KnowledgeNodeResponse(BaseModel):
    id: str
    entity_name: str
    entity_type: str
    statute_name: Optional[str] = None
    section_number: Optional[str] = None
    description: str
    source_url: Optional[str] = None
    metadata_json: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class KnowledgeEdgeResponse(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relationship_type: str
    description: Optional[str] = None
    verified_source: str

    model_config = ConfigDict(from_attributes=True)


class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeNodeResponse]
    edges: List[KnowledgeEdgeResponse]


# ==================== Feedback & Audit Schemas ====================
class UserFeedbackCreate(BaseModel):
    message_id: str
    is_helpful: bool
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None
    citation_accurate: Optional[bool] = None


class UserFeedbackResponse(BaseModel):
    id: str
    user_id: str
    message_id: str
    is_helpful: bool
    rating: Optional[int] = None
    comments: Optional[str] = None
    citation_accurate: Optional[bool] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details_json: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Privacy Schemas ====================
class UserPrivacyPreferenceUpdate(BaseModel):
    consent_data_retention: Optional[bool] = None
    consent_personalization: Optional[bool] = None
    analytics_opt_in: Optional[bool] = None
    retention_days: Optional[int] = Field(None, ge=1, le=365)


class UserPrivacyPreferenceResponse(BaseModel):
    consent_data_retention: bool
    consent_personalization: bool
    analytics_opt_in: bool
    retention_days: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserExportDataResponse(BaseModel):
    user_profile: UserResponse
    privacy_preferences: Optional[UserPrivacyPreferenceResponse] = None
    conversations: List[Dict[str, Any]]
    generated_documents: List[Dict[str, Any]]
    feedback_submissions: List[Dict[str, Any]]
    exported_at: datetime


# ==================== System Health Schemas ====================
class HealthCheckResponse(BaseModel):
    status: str
    project: str
    version: str
    environment: str
    database_connected: bool
    llm_provider: str
    indexed_documents_count: int
    vector_store_ready: bool
