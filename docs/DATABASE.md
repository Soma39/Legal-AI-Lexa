# LegalAI Database Schema Documentation

## 1. Relational Entity Overview
The database schema is implemented using SQLAlchemy 2.0 and versioned with Alembic migrations.

```
       +-----------------------+           +--------------------------+
       |         users         | 1       * |   user_privacy_prefs     |
       |-----------------------|-----------|--------------------------|
       | id (UUID, PK)         |           | id (UUID, PK)            |
       | email (VARCHAR, UQ)   |           | user_id (FK -> users)    |
       | hashed_password       |           | retention_days (INT)     |
       | full_name             |           | consent_retention (BOOL) |
       | role ('user'/'admin') |           +--------------------------+
       +-----------------------+
           | 1             | 1
           | *             | *
           v               v
  +----------------+  +--------------------+
  | conversations  |  | generated_documents|
  |----------------|  |--------------------|
  | id (UUID, PK)  |  | id (UUID, PK)      |
  | user_id (FK)   |  | user_id (FK)       |
  | title          |  | template_id (FK)   |
  | topic          |  | title              |
  | jurisdiction   |  | input_data_json    |
  +----------------+  | generated_content  |
          | 1         +--------------------+
          | *
          v
  +----------------+
  |    messages    |
  |----------------|
  | id (UUID, PK)  |
  | conv_id (FK)   |
  | sender         |
  | content        |
  | disclaimer     |
  +----------------+
          | 1
          | *
          v
  +----------------+
  |source_citations|
  |----------------|
  | id (UUID, PK)  |
  | message_id (FK)|
  | statute_name   |
  | section        |
  | source_url     |
  | exact_quote    |
  +----------------+
```

## 2. Table Specifications

### `users`
- Primary user accounts table.
- Stores Argon2 hashed passwords (never plaintext).
- Fields: `id`, `email`, `hashed_password`, `full_name`, `role`, `is_active`, `is_superuser`, `created_at`, `updated_at`, `last_login_at`.

### `conversations`
- Multi-turn conversation threads.
- Fields: `id`, `user_id` (FK to users.id ondelete CASCADE), `title`, `topic`, `jurisdiction`, `is_pinned`, `created_at`, `updated_at`.

### `messages`
- Individual question and answer exchanges.
- Fields: `id`, `conversation_id` (FK ondelete CASCADE), `sender` ('user', 'assistant', 'system'), `content`, `disclaimer`, `confidence_score`, `intent`, `detected_jurisdiction`, `created_at`.

### `source_citations`
- Verified statutory citations strictly linked to an assistant message.
- Fields: `id`, `message_id` (FK ondelete CASCADE), `document_title`, `section_or_article`, `statute_name`, `source_url`, `page_number`, `exact_quote`, `relevance_score`, `created_at`.

### `legal_documents`
- Statutory acts, court judgments, or notifications in the knowledge base.
- Fields: `id`, `title`, `document_type`, `jurisdiction`, `publication_date`, `effective_date`, `amendment_status`, `source_url`, `file_path`, `file_size`, `ingestion_status`, `version`, `created_at`, `updated_at`.

### `document_chunks`
- Indexed textual passages extracted from legal documents for semantic search.
- Fields: `id`, `document_id` (FK ondelete CASCADE), `chunk_index`, `content`, `metadata_json`, `token_count`, `created_at`.

### `document_templates`
- Configuration schemas for the 6 drafting templates.
- Fields: `id`, `code` (UQ), `name`, `description`, `category`, `purpose_and_limitations`, `schema_json`, `is_active`, `created_at`.

### `generated_documents`
- User-generated legal drafts.
- Fields: `id`, `user_id` (FK ondelete CASCADE), `template_id` (FK ondelete SET NULL), `title`, `document_type`, `input_data_json`, `generated_content`, `status`, `created_at`, `updated_at`.

### `knowledge_nodes` & `knowledge_edges`
- Relational graph tables storing legal entities (Acts, Sections, Rules) and relationships (`REPLACES`, `CONTAINS`, `REFERENCES`) with verified source references.

### `audit_logs`
- Security and compliance audit trail tracking logins, data exports, document generations, and administrative actions without storing sensitive conversational payloads.
