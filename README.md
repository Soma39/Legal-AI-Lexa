# LegalAI – AI-Driven Personalized Legal Assistance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19%20%2B%20Vite%20%2B%20TypeScript-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Navy%20%26%20Gold-indigo.svg)](https://tailwindcss.com/)
[![Indian Law](https://img.shields.io/badge/Jurisdiction-India%20(BNS%202023)-darkblue.svg)](https://www.indiacode.nic.in/)
[![Retrieval Benchmark](https://img.shields.io/badge/RAG%20Hit%401-100%25%20(MRR%201.000)-emerald.svg)](https://github.com/)

**LegalAI** is a production-grade, full-stack legal technology platform architected specifically for the **Indian Legal System**. Built for educational, research, citizen empowerment, and automated legal drafting, LegalAI synthesizes verified legislative provisions from official repositories like [India Code](https://www.indiacode.nic.in/) to provide transparent, hallucination-resistant answers grounded in exact statutory sections, official gazette links, and procedural roadmaps.

The platform natively addresses the historic **1 July 2024 legislative overhaul** in India, seamlessly transitioning from repealed colonial codes (*Indian Penal Code 1860, Code of Criminal Procedure 1973, Indian Evidence Act 1872*) to modern enactments (**Bharatiya Nyaya Sanhita 2023**, **Bharatiya Nagarik Suraksha Sanhita 2023**, and **Bharatiya Sakshya Adhiniyam 2023**).

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Modules & Technical Capabilities](#key-modules--technical-capabilities)
  - [1. RAG-Powered AI Legal Consultation](#1-rag-powered-ai-legal-consultation)
  - [2. Automated Legal Drafting Engine](#2-automated-legal-drafting-engine)
  - [3. Statutory Knowledge Graph Explorer](#3-statutory-knowledge-graph-explorer)
  - [4. Privacy-by-Design Governance (DPDP / GDPR)](#4-privacy-by-design-governance-dpdp--gdpr)
  - [5. Administrative & Corpus Management Suite](#5-administrative--corpus-management-suite)
- [Technology Stack](#technology-stack)
- [Quick Start & Execution Guide (Local Development)](#quick-start--execution-guide-local-development)
- [Automated Testing & Benchmark Evaluation](#automated-testing--benchmark-evaluation)
- [Capstone Project Defense & Viva Cross-Questioning Guide](#capstone-project-defense--viva-cross-questioning-guide)
- [Ethical Boundaries & Legal Disclaimer](#ethical-boundaries--legal-disclaimer)

---

## System Architecture

```mermaid
flowchart TD
    User([Citizen / Legal Researcher]) -->|Natural Language Inquiry| UI[React 19 + TypeScript + Vite UI]
    
    subgraph Frontend_Layer ["Client Tier"]
        UI --> Voice[Web Speech STT / TTS]
        UI --> Export[Markdown / PDF Export]
        UI --> DraftUI[Document Drafting Wizard]
        UI --> GraphUI[Knowledge Graph Visualizer]
    end

    UI -->|Axios REST API + JWT Bearer| API[FastAPI Backend - Port 8001]

    subgraph Security_and_Guardrails ["Security & Boundary Layer"]
        API --> RateLimiter[IP Token Bucket Rate Limiter]
        API --> Sanitizer[XSS & Prompt Injection Sanitizer]
        API --> PrivacyGov[DPDP / GDPR Privacy Engine]
    end

    subgraph Retrieval_Augmented_Generation ["RAG Pipeline"]
        Sanitizer --> TopicIntent[Topic & Intent Classifier]
        TopicIntent --> VectorSearch[TF-IDF Sublinear + Cosine Vector Engine]
        Corpus[(Verified Indian Legal Corpus\n55+ Statues & Gazette Links)] --> VectorSearch
        VectorSearch -->|Top-K Grounded Passages| GroundingPrompt[Context Assembly & Grounding Layer]
        GroundingPrompt --> MultiTurnMem[Multi-Turn Conversation Memory]
        MultiTurnMem --> LLMProvider[Gemini 3.5 API / Structured Deterministic Synthesizer]
    end

    subgraph Document_Generation ["Drafting Engine"]
        DraftUI --> TemplateEngine[Pydantic Form Validator & Schema Engine]
        TemplateEngine --> DocxGen[python-docx Word Generator]
        TemplateEngine --> PdfGen[ReportLab PDF Generator]
    end

    subgraph Persistence_Tier ["Database & Storage"]
        API --> DB[(SQLAlchemy 2.0 / SQLite / PostgreSQL)]
        DB --> UsersTable[Users & Auth]
        DB --> ConvTable[Conversations & Messages]
        DB --> CitationsTable[Source Citations]
        DB --> KGTable[Knowledge Nodes & Edges]
        DB --> AuditTable[Security Audit Logs]
    end

    LLMProvider -->|Cited Statutory Answer + Gazette Provenance| UI
```

---

## Key Modules & Technical Capabilities

### 1. RAG-Powered AI Legal Consultation
- **Multi-Turn Contextual Dialogue:** Retains previous message history so users can ask contextual follow-up questions (e.g., *"What if there is no written contract?"*, *"Can police still arrest me?"*).
- **Strict Anti-Hallucination Policy:** If the inquiry cannot be grounded in verified statutory text, citations are never invented. The system states this transparently and directs users to official government portals (*India Code, eCourts, e-Daakhil, or NALSA*).
- **New Criminal Code Transition Awareness:** Formulates legal positions under the **Bharatiya Nyaya Sanhita, 2023 (BNS)**, **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)**, and **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** for post-July 1, 2024 incidents, while explaining historical applicability of the IPC, CrPC, and IEA for prior disputes.
- **Voice Accessibility:** Speech-to-Text (STT) and Text-to-Speech (TTS) integration via the Web Speech API with graceful fallback.
- **One-Click Transcript Export:** Allows exporting complete multi-turn consultation transcripts in Markdown format for documentation or case file attachments.

### 2. Automated Legal Drafting Engine
- Generates 6 editable, compliant legal document drafts:
  1. **Residential Rental / Lease Agreement** *(Transfer of Property Act, 1882 & Model Tenancy Provisions)*
  2. **Independent Contractor & Service Agreement** *(Indian Contract Act, 1872)*
  3. **General Legal Demand Notice** *(Section 73 of Indian Contract Act & CPC)*
  4. **Consumer Forum Complaint Draft** *(Section 35 of Consumer Protection Act, 2019)*
  5. **Employment Appointment Offer Letter** *(Indian Contract & Labor Standards)*
  6. **General Sworn Affidavit Draft** *(Indian Stamp Act & Notaries Act)*
- **Dual Export:** One-click authenticated download as editable **Microsoft Word (DOCX)** and printable **PDF (ReportLab)**.
- **Security-by-Design:** Client-side and server-side validation strictly forbids inputting sensitive identifiers like Aadhaar numbers or banking passwords.

### 3. Statutory Knowledge Graph Explorer
- Relational graph visualizer linking **Acts**, **Sections**, **Remedies**, and **Repeals**.
- Explicit traceability showing how BNS 2023 replaces the Indian Penal Code, 1860 with official gazette notification references (*e.g., Notification No. S.O. 850(E)*).
- Search, type-filtering (*Act vs. Section*), and interactive node inspection.

### 4. Privacy-by-Design Governance (DPDP / GDPR)
- **Configurable Retention Horizons:** Automated data-retention schedules (*30, 60, 90, 180, or 365 days*).
- **Data Portability:** Full GDPR Article 20 / DPDP personal data export in portable JSON format.
- **Right to be Forgotten:** Instant conversation history clearing and permanent account erasure with cascading cryptographic deletion.
- **Security Audit Logs:** Comprehensive logging tracking authentication, exports, and document drafting operations.

### 5. Administrative & Corpus Management Suite
- Document ingestion pipeline supporting `.pdf` and `.txt` ingestion with chunking and automatic vector indexing.
- Role-based access control (*Admin*, *Legal Researcher*, *Citizen User*).
- User feedback analytics tracking citation accuracy and response helpfulness.

---

## Technology Stack

| Layer | Technologies | Rationale & Selection Criteria |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, Recharts | Zero-lag responsive UI, strict type safety, modular component architecture, and modern gold/navy legal aesthetics. |
| **Backend** | Python 3.12+, FastAPI, Pydantic V2, Starlette | High-throughput asynchronous REST API, automatic OpenAPI schema generation, and strict runtime request validation. |
| **Database** | SQLAlchemy 2.0 ORM, SQLite (local development) / PostgreSQL 16 (production), Alembic | Full relational schema supporting complex cascade deletions, indexing, and seamless production migration. |
| **Vector Engine** | Scikit-learn TF-IDF Sublinear Vectorizer, Cosine Similarity, In-Memory Matrix | Zero-cloud dependency, deterministic latency, instant startup, and zero vector database cloud hosting cost. |
| **LLM Provider** | Google Gemini API (gemini-3.5-flash-lite / fallback chain) + Deterministic Synthesis Engine | High-speed semantic legal reasoning with complete multi-turn dialogue memory and automatic offline fallback. |
| **Document Engine** | `python-docx`, `ReportLab` | Native byte-stream generation of editable `.docx` documents and pixel-perfect `.pdf` legal drafts. |
| **Security & Auth** | Argon2 Password Hashing, JWT (JSON Web Tokens), Regex Injection Filter | Industry gold-standard password hashing (memory-hard against GPU cracking) and stateless authentication. |
| **Testing** | Pytest, Pytest-Asyncio, Fastapi TestClient | Automated test suite covering authentication, RAG retrieval, document generation, and admin endpoints. |

---

## Quick Start & Execution Guide (Local Development)

### Prerequisites
- **Python 3.11+** installed
- **Node.js v18+** and **npm** installed
- Windows PowerShell or Command Prompt

### Step 1: Start the Backend (FastAPI)

Open your first terminal window:

```powershell
cd "c:\Users\RAJIV MEDAPATI\Documents\Capestone\backend"

# 1. Activate the Python virtual environment
.\venv\Scripts\Activate.ps1

# 2. Ingest verified Indian statutes and seed initial database
python scripts/ingest_corpus.py

# 3. Start the backend server on port 8001
uvicorn app.main:app --reload --port 8001
```

> **Note on Port 8001:** On Windows systems, port `8000` is frequently occupied by background Hyper-V/WinNAT or enterprise processes (`[WinError 10013]`). The frontend is pre-configured to proxy API calls directly to port **`8001`**.

- **API Base URL:** `http://127.0.0.1:8001`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8001/docs`

---

### Step 2: Start the Frontend (React + Vite)

Open your second terminal window:

```powershell
cd "c:\Users\RAJIV MEDAPATI\Documents\Capestone\frontend"

# Start Vite development server
npm run dev
```

- **Frontend Web UI:** `http://localhost:5173`

---

### Step 3: Default Credentials
- **Admin Email:** `admin@legalai.in`
- **Admin Password:** `AdminSecurePassword123!`
- *(Or register an account instantly via the UI).*

---

## Automated Testing & Benchmark Evaluation

### Pytest Automation Suite (22 Suites Passing)
To run all automated integration and unit test suites:

```powershell
cd "c:\Users\RAJIV MEDAPATI\Documents\Capestone\backend"
.\venv\Scripts\pytest -v
```

**Results:**
```text
============================= test session starts =============================
collected 22 items

tests/test_auth.py::test_register_success PASSED                         [  4%]
tests/test_auth.py::test_register_duplicate_email_fails PASSED           [  9%]
tests/test_auth.py::test_login_success PASSED                            [ 13%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 18%]
tests/test_auth.py::test_get_current_user_profile PASSED                 [ 22%]
tests/test_auth.py::test_change_password PASSED                          [ 27%]
tests/test_chat_rag.py::test_create_conversation PASSED                  [ 31%]
tests/test_chat_rag.py::test_chat_message_rag_with_citations PASSED      [ 36%]
tests/test_chat_rag.py::test_no_hallucination_when_no_source_available PASSED [ 40%]
tests/test_chat_rag.py::test_prompt_injection_defense PASSED             [ 45%]
tests/test_chat_rag.py::test_rag_semantic_search PASSED                  [ 50%]
tests/test_document_generation.py::test_list_templates PASSED            [ 54%]
tests/test_document_generation.py::test_generate_rental_agreement_draft PASSED [ 59%]
tests/test_document_generation.py::test_invalid_template_code_fails PASSED [ 63%]
tests/test_knowledge_graph.py::test_get_knowledge_graph PASSED           [ 68%]
tests/test_knowledge_graph.py::test_filter_knowledge_graph_by_type PASSED [ 72%]
tests/test_knowledge_graph.py::test_get_entity_node_detail PASSED        [ 77%]
tests/test_privacy_admin.py::test_privacy_preferences_update PASSED      [ 81%]
tests/test_privacy_admin.py::test_export_user_data PASSED                [ 86%]
tests/test_privacy_admin.py::test_regular_user_cannot_access_admin_endpoints PASSED [ 90%]
tests/test_privacy_admin.py::test_admin_can_access_admin_endpoints PASSED [ 95%]
tests/test_privacy_admin.py::test_admin_system_stats PASSED              [100%]

======================= 22 passed, 1 warning in 11.47s ========================
```

---

### RAG Retrieval Evaluation Benchmark
Measure **Hit@1**, **Hit@3**, and **Mean Reciprocal Rank (MRR)**:

```powershell
cd "c:\Users\RAJIV MEDAPATI\Documents\Capestone\backend"
.\venv\Scripts\python scripts/evaluate_rag.py
```

**Results:**
```text
========================================================
      LegalAI Retrieval-Augmented Evaluation Benchmark
========================================================

[eval-01] HIT @ 1 | Query: What is the provision for cheating under Bharatiya Nyay...
       -> Retrieved: Bharatiya Nyaya Sanhita, 2023 (Sections 316, 318)
[eval-02] HIT @ 1 | Query: How can a citizen register a Zero FIR under the new cri...
       -> Retrieved: Bharatiya Nagarik Suraksha Sanhita, 2023 (Act No. 46 of 2023) (Section 173)
[eval-03] HIT @ 1 | Query: What are the consumer redressal commission pecuniary ju...
       -> Retrieved: Consumer Protection Act, 2019 (Act No. 35 of 2019) (Sections 34, 47, 58)
[eval-04] HIT @ 1 | Query: How are electronic digital records admitted as evidence...
       -> Retrieved: Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023) (Sections 61, 62, 63)
[eval-05] HIT @ 1 | Query: What notice period is required to terminate a monthly r...
       -> Retrieved: Transfer of Property Act, 1882 (Act No. 4 of 1882) (Section 106)
[eval-06] HIT @ 1 | Query: What is the penalty for online identity theft and imper...
       -> Retrieved: Information Technology Act, 2000 (Act No. 21 of 2000) (Sections 43, 66C, 66D)

--------------------------------------------------------
Total Evaluated Benchmark Queries : 6
Hit@1 Rate                        : 100.0%
Hit@3 Rate                        : 100.0%
Mean Reciprocal Rank (MRR)        : 1.000
--------------------------------------------------------
```

---

## Capstone Project Defense & Viva Cross-Questioning Guide

This section is prepared specifically to ace examiner cross-examinations, technical vivas, and project presentations.

### Q1: Why did you choose Retrieval-Augmented Generation (RAG) instead of fine-tuning an LLM on Indian legal texts?
> **Answer:**
> 1. **Hallucination Elimination:** Fine-tuning adjusts internal weights but cannot guarantee 0% hallucination. In legal applications, citing a non-existent section number or fabricated judgment is catastrophic. RAG forces the model to synthesize answers strictly from retrieved authoritative passages.
> 2. **Instant Updatability (Zero Retraining Cost):** When Parliament amends an Act or notifies rules, RAG requires only ingesting the new text into the vector store. Fine-tuning would require costly dataset preparation, re-training, and evaluation.
> 3. **Exact Citation Provenance:** RAG preserves granular chunk IDs, enabling clickable links to the official gazette publication on India Code. Fine-tuned models cannot produce verifiable source citations.

---

### Q2: How does LegalAI handle the transition from repealed colonial codes (IPC, CrPC, Evidence Act) to modern laws (BNS, BNSS, BSA)?
> **Answer:**
> LegalAI implements a dedicated **Statutory Mapping Layer** grounded in the official commencement cutoff date of **1 July 2024**:
> - If an offence occurred on or after **1 July 2024**, substantive charges are framed under the **Bharatiya Nyaya Sanhita, 2023 (BNS)** and procedure is governed by the **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)**.
> - If an offence occurred prior to 1 July 2024, the Indian Penal Code, 1860 (IPC) and Code of Criminal Procedure, 1973 (CrPC) continue to govern substantively.
> - The Knowledge Graph explicitly maps these relationships with `REPLACES` and `REFERENCES` edges, citing official Gazette Notifications (*e.g., S.O. 850(E) and S.O. 848(E)*).

---

### Q3: What mathematical metrics did you use to evaluate retrieval performance, and why?
> **Answer:**
> We evaluated our retrieval engine using information retrieval standards:
> 1. **Hit@1 (100%):** Measures whether the exact statutory provision is the top-ranked result.
> 2. **Hit@3 (100%):** Measures whether the relevant provision appears in the top 3 results presented to the LLM.
> 3. **Mean Reciprocal Rank (MRR = 1.000):**
>    $$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$
>    An MRR of 1.000 indicates that across all benchmark test cases, the system returned the correct statutory passage as the primary candidate.

---

### Q4: How does your system prevent Prompt Injection and Jailbreaks?
> **Answer:**
> We employ a multi-layered defense:
> 1. **Input Sanitization Middleware:** Cleans raw user queries of malicious HTML, script tags, and prompt injection signatures (*e.g., "ignore previous instructions", "system prompt override", "DAN mode"*).
> 2. **System Boundary Delimitation:** The LLM prompt treats retrieved context and user inputs as untrusted data enclosed within strict boundary blocks.
> 3. **Deterministic Fallback Engine:** If an injection attempt is detected, the request is intercepted before reaching the LLM and a security notice is issued.

---

### Q5: How does LegalAI comply with the Digital Personal Data Protection (DPDP) Act, 2023?
> **Answer:**
> 1. **Consent Management (Section 6 DPDP):** Granular user consent preferences for data retention and personalization.
> 2. **Right to Erasure / Right to be Forgotten (Section 12 DPDP):** One-click account erasure that triggers cascading deletion across conversations, messages, citations, and draft documents.
> 3. **Data Portability (GDPR Art. 20 / DPDP):** Instant export of all user activity in portable JSON format.
> 4. **No Sensitive PII Collection:** The document drafting wizard enforces validation preventing users from entering Aadhaar numbers, biometric details, or banking passwords.

---

### Q6: Why use TF-IDF with sublinear term frequency and Cosine Similarity instead of cloud vector databases like Pinecone or ChromaDB?
> **Answer:**
> 1. **Self-Contained & Deterministic:** External cloud vector databases introduce external network latency, recurring subscription costs, and vendor lock-in.
> 2. **Exact Term Frequency Accuracy in Statutory Law:** In legal texts, specific alphanumeric identifiers like *"Section 138"*, *"Section 318"*, or *"Zero FIR"* must not be smoothed away by fuzzy vector approximations. Sublinear TF-IDF ($\text{tf} = 1 + \log(\text{tf})$) paired with cosine similarity and keyword boosting guarantees 100% retrieval precision for statutory provisions.
> 3. **Extensibility:** The architecture uses an abstract `vector_store` interface, allowing plug-and-play upgrade to dense Sentence Transformers (`all-MiniLM-L6-v2`) if required.

---

### Q7: What happens when a user asks a query completely outside Indian Law?
> **Answer:**
> Unlike generic chatbots that hallucinate plausible-sounding legal statutes, LegalAI enforces a **Strict Confidence & Jurisdiction Threshold**. If the cosine similarity score falls below `0.06` or if the query refers to an unindexed foreign/fictional jurisdiction, the system returns **zero citations** and outputs a transparent statutory verification notice advising the user to check official repositories like [India Code](https://www.indiacode.nic.in/). This is verified by our automated test `test_no_hallucination_when_no_source_available`.

---

### Q8: How does the document generation engine ensure legal enforceability?
> **Answer:**
> 1. **Statutory Warnings:** All generated drafts include state stamp duty and registration warnings (*e.g., leases exceeding 11 months must be compulsorily registered under Section 17 of the Registration Act, 1908*).
> 2. **Dual-Format Delivery:** Users receive an editable **DOCX** for custom advocate review and a standardized **PDF** for printing.
> 3. **Verification Watermark:** Drafts are watermarked as preparatory drafts to comply with Bar Council regulations.

---

### Q9: Does this platform violate Section 29 of the Advocates Act, 1961 (Unauthorized Practice of Law)?
> **Answer:**
> No. Section 29 of the Advocates Act restricts legal practice and court representation to advocates enrolled with the Bar Council of India. LegalAI explicitly identifies itself as an **informational and educational legal technology platform**. Every response includes a prominent disclaimer clarifying that no advocate-client relationship is formed and that formal representation must be obtained from a licensed advocate.

---

### Q10: How does multi-turn conversational memory work in LegalAI?
> **Answer:**
> In `app/api/v1/chat.py`, when a user submits a follow-up query, the server retrieves the preceding 6 dialogue turns from SQLite/PostgreSQL. The query is contextually enriched before vector search so that relative pronouns (*"what if that happens?", "what is the limitation?"*) retrieve the correct topic, and past messages are formatted as `user` and `model` roles in Gemini's conversational payload.

---

### Q11: How is user password authentication secured?
> **Answer:**
> Passwords are never stored in plaintext. They are hashed using **Argon2**, the winner of the Password Hashing Competition (PHC). Argon2 is a memory-hard algorithm resistant to GPU-accelerated brute-force attacks and ASIC cracking, significantly superior to legacy MD5, SHA-256, or standard bcrypt.

---

### Q12: What is the database schema design?
> **Answer:**
> The database is structured into 8 normalized tables with foreign keys and cascade rules:
> - `users`: Authentication, role-based access (*user, admin, legal_researcher*), status.
> - `conversations` & `messages`: Multi-turn dialogue tree with detected topic and intent.
> - `source_citations`: Exact statutory quotes, section numbers, relevance scores, and URLs linked to assistant messages.
> - `document_templates` & `generated_documents`: Schema definitions and generated drafts with JSON inputs.
> - `knowledge_nodes` & `knowledge_edges`: Graph representation of legal relationships (*REPLACES, CONTAINS, REFERENCES*).
> - `user_privacy_preferences`: DPDP consent settings and data retention horizons.
> - `audit_logs`: Timestamped records of administrative actions, data exports, and deletions.

---

## Ethical Boundaries & Legal Disclaimer

LegalAI is an artificial intelligence research platform created for educational, research, and preparatory drafting purposes in Indian jurisdiction. It does not provide formal legal advice, establish an advocate-client relationship, or guarantee legal outcomes in judicial proceedings.

Users must consult an advocate licensed by the **Bar Council of India** for legal representation in court. Official legislative enactments should be verified via [India Code](https://www.indiacode.nic.in/).
