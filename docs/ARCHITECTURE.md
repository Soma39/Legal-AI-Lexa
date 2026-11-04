# LegalAI Architecture Documentation

## 1. System Overview
LegalAI is designed with a decoupled, three-tier microservice architecture prioritizing reliability, auditability, data privacy, and zero hallucination.

```
       +-------------------------------------------------------------+
       |                  Vite + React Frontend (SPA)               |
       |  - Tailwind CSS (Navy & Gold Theme)                         |
       |  - Web Speech API (STT Voice & TTS Audio)                   |
       |  - Recharts Dashboard Analytics                             |
       |  - Interactive Knowledge Graph Explorer (SVG)               |
       +------------------------------+------------------------------+
                                      | HTTP/REST (JSON + JWT)
                                      v
       +-------------------------------------------------------------+
       |                    FastAPI Backend Engine                   |
       |  +---------------------+   +-----------------------------+  |
       |  |  Security & Auth    |   |  RAG Retrieval Engine       |  |
       |  |  - Argon2 Hasher    |   |  - TF-IDF / Vector Store    |  |
       |  |  - JWT HS256        |   |  - Query Sanitizer & Intent |  |
       |  |  - Rate Limiter     |   |  - Re-ranker & Provenance   |  |
       |  +---------------------+   +-----------------------------+  |
       |  +---------------------+   +-----------------------------+  |
       |  |  Drafting Service   |   |  Knowledge Graph Service    |  |
       |  |  - python-docx      |   |  - Statutory Nodes & Edges  |  |
       |  |  - ReportLab PDF    |   |  - Gazette Repeal Links     |  |
       |  +---------------------+   +-----------------------------+  |
       +------------------------------+------------------------------+
                                      | SQLAlchemy 2.0 ORM
                                      v
       +-------------------------------------------------------------+
       |             Relational Database & File Storage              |
       |  - PostgreSQL 16 (Production) / SQLite (Dev Fallback)       |
       |  - Vector Embeddings Storage (Persistent JSON / NPY)        |
       |  - Uploaded & Generated File Cache (DOCX / PDF)             |
       +-------------------------------------------------------------+
```

## 2. Core Subsystems

### A. RAG Retrieval-Augmented Generation Pipeline
1. **Input Sanitization & Injection Defense**: Raw user query is stripped of dangerous HTML/script tags and inspected for prompt-override tokens (e.g., `ignore previous instructions`).
2. **Intent & Topic Classifier**: Multi-label rule classifier identifies domain (Consumer Rights, Property & Tenancy, Employment, Contract Law, Cybercrime, Criminal Law, Civil Disputes).
3. **Corpus Retrieval**: Sublinear TF-IDF vectorizer computes n-gram features against indexed statutory chunks from India Code. Chunks scoring above the dynamic threshold are returned.
4. **Zero-Hallucination Fallback**: If no chunk exceeds the minimum relevance threshold (e.g. out-of-jurisdiction or nonsensical queries), the engine unconditionally halts answer synthesis and returns a formal verification notice advising India Code lookup.
5. **Answer Synthesis**: Deterministic statutory breakdown extracts text from the verified chunks, highlights commencement date transitions (e.g., BNS 2023 vs IPC 1860), and formats structured takeaways.
6. **Provenance Tracking**: Each assertion is paired with a `SourceCitation` linked to the exact section, statute title, and India Code URL.

### B. Document Drafting Engine
1. **Schema-Driven Template Model**: Reusable document templates specify structured Pydantic validation fields (e.g. monthly rent, notice period days, cure periods).
2. **Template Formatters**: Pure-Python template formatters generate legal prose conforming to the Transfer of Property Act, Contract Act, Consumer Protection Act, etc.
3. **Dual File Artifact Exporter**:
   - `python-docx`: Formats styled `.docx` files with standard 1-inch legal margins, custom typography, and signature tables.
   - `ReportLab`: Compiles print-ready vector `.pdf` files with document watermarks and legal disclaimers.

### C. Legal Knowledge Graph
1. **Nodes**: Represent legal entities (Acts, Sections, Rules, Legal Topics).
2. **Edges**: Represent directed relationships (`REPLACES`, `CONTAINS`, `REFERENCES`, `AMENDS`, `DEFINES`).
3. **Traceability**: Every edge contains a `verified_source` reference (e.g., Ministry of Home Affairs Gazette Notification No. S.O. 850(E) for BNS 2023).

### D. Privacy & Compliance Layer
1. **Consent Registry**: Manages user permissions for history retention and personalization.
2. **Automated Horizon Purging**: Configurable retention horizon flags old inquiries for automatic deletion.
3. **GDPR / DPDP Export**: Bundles profile, chats, citations, drafts, and audit logs into a portable JSON document.
4. **Right to be Forgotten**: Complete cascaded database erasure on user request.
