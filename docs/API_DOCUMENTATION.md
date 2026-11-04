# LegalAI API Documentation

All API endpoints are prefixed with `/api/v1`. Interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
Register a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "full_name": "Full Name"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user_id": "uuid",
    "email": "user@example.com",
    "full_name": "Full Name",
    "role": "user"
  }
  ```

### `POST /api/v1/auth/login`
Authenticate user credentials and receive JWT access token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```

### `GET /api/v1/auth/me`
Retrieve currently authenticated user's profile.
- **Headers**: `Authorization: Bearer <token>`

---

## 2. Legal Chat & RAG Endpoints

### `GET /api/v1/chat/conversations`
List user's conversation threads.

### `POST /api/v1/chat/conversations`
Create a new conversation thread.
- **Request Body**:
  ```json
  {
    "title": "Tenancy Rights Inquiry",
    "topic": "Property and Rental Matters",
    "jurisdiction": "India"
  }
  ```

### `POST /api/v1/chat/conversations/{id}/messages`
Send an inquiry to the chatbot. Executes RAG retrieval against verified Indian statutes and returns structured cited response.
- **Request Body**:
  ```json
  {
    "content": "What is the notice period for terminating a residential lease in India?",
    "jurisdiction": "India"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender": "assistant",
    "content": "Based on verified Indian statutory law...",
    "citations": [
      {
        "statute_name": "Transfer of Property Act, 1882",
        "section_or_article": "Sections 105, 106, 107, 108",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/2338",
        "exact_quote": "Section 106 governs duration of leases in absence of written contract...",
        "relevance_score": 0.88
      }
    ],
    "disclaimer": "Educational and Informational Disclaimer...",
    "confidence_score": 0.92,
    "created_at": "2026-10-14T11:30:00Z"
  }
  ```

### `POST /api/v1/rag/ask-direct`
Direct one-shot Q&A for landing page and dashboard search bar.
- **Query Params**: `q=<query>&jurisdiction=India`

---

## 3. Document Drafting Endpoints

### `GET /api/v1/documents/templates`
List all 6 drafting templates and schema fields.

### `POST /api/v1/documents/drafts`
Generate a draft from template data.
- **Request Body**:
  ```json
  {
    "template_code": "residential_rental_agreement",
    "title": "Apartment Lease Draft",
    "input_data": {
      "landlord_name": "Arun Sharma",
      "tenant_name": "Priya Nair",
      "monthly_rent": 25000,
      "lease_term_months": 11,
      "state_jurisdiction": "Maharashtra"
    }
  }
  ```

### `GET /api/v1/documents/drafts/{id}/download/docx`
Stream editable Microsoft Word (.docx) document.

### `GET /api/v1/documents/drafts/{id}/download/pdf`
Stream printable ReportLab PDF (.pdf) document.

---

## 4. Knowledge Graph & Privacy Endpoints

### `GET /api/v1/graph`
Retrieve all statutory nodes and directed relationships.

### `GET /api/v1/privacy/export`
GDPR Article 20 / DPDP Act personal data download in portable JSON.

### `DELETE /api/v1/privacy/delete-account`
Permanent Right to be Forgotten account erasure.
