export interface User {
  id: str;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'legal_researcher';
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login_at?: string;
}

type str = string;

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface SourceCitation {
  id: string;
  document_title: string;
  section_or_article?: string;
  statute_name: string;
  source_url?: string;
  page_number?: number;
  exact_quote?: string;
  relevance_score: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  disclaimer?: string;
  confidence_score?: number;
  intent?: string;
  detected_jurisdiction?: string;
  citations?: SourceCitation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  jurisdiction: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date';
  required: boolean;
  default?: any;
  placeholder?: string;
}

export interface DocumentTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  purpose_and_limitations: string;
  form_schema?: {
    fields: TemplateField[];
  };
  schema_json?: {
    fields: TemplateField[];
  };
  is_active: boolean;
}

export interface GeneratedDocument {
  id: string;
  user_id: string;
  template_id?: string;
  title: string;
  document_type: string;
  input_data_json: Record<string, any>;
  generated_content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeNode {
  id: string;
  entity_name: string;
  entity_type: string;
  statute_name?: string;
  section_number?: string;
  description: string;
  source_url?: string;
  metadata_json?: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  description?: string;
  verified_source: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface PrivacyPreferences {
  consent_data_retention: boolean;
  consent_personalization: boolean;
  analytics_opt_in: boolean;
  retention_days: number;
  updated_at: string;
}

export interface SystemStats {
  total_users: number;
  total_conversations: number;
  total_drafts: number;
  total_legal_documents: number;
  total_indexed_chunks: number;
  vector_store_chunks_count: number;
  total_feedback_count: number;
  positive_feedback_ratio: number;
  citation_accuracy_ratio: number;
  llm_provider: string;
  environment: string;
}

export interface LegalDocumentItem {
  id: string;
  title: string;
  document_type: string;
  jurisdiction: string;
  publication_date?: string;
  effective_date?: string;
  amendment_status?: string;
  source_url?: string;
  file_size: number;
  ingestion_status: string;
  version: string;
  created_at: string;
}
