# LegalAI – AI-Driven Personalized Legal Assistance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React 18+](https://img.shields.io/badge/React-Vite%20%2B%20TypeScript-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Navy%20%26%20Gold-indigo.svg)](https://tailwindcss.com/)
[![Indian Law](https://img.shields.io/badge/Jurisdiction-India%20(BNS%202023)-darkblue.svg)](https://www.indiacode.nic.in/)

LegalAI is an end-to-end, production-grade legal technology platform designed specifically for the jurisdiction of **India**. Built for educational, research, and preparatory legal drafting, LegalAI synthesizes verified legislative provisions from official repositories like [India Code](https://www.indiacode.nic.in/) and provides transparent, hallucination-resistant answers paired with exact statutory sections and official links.

---

## Key Modules & Capabilities

1. **RAG-Powered AI Legal Chatbot**
   - Natural language statutory question answering with verified Indian legislative citations.
   - Awareness of the transition from repealed colonial codes (IPC 1860, CrPC 1973, Evidence Act 1872) to modern criminal enactments (**Bharatiya Nyaya Sanhita, 2023**, **Bharatiya Nagarik Suraksha Sanhita, 2023**, and **Bharatiya Sakshya Adhiniyam, 2023**).
   - Strict hallucination defense: if an inquiry cannot be grounded in verified statutory text, citations are never invented and users are directed to official portals or qualified advocates.
   - Built-in prompt injection sanitization.
   - Speech-to-Text (STT) and Text-to-Speech (TTS) via Web Speech API with graceful degradation.

2. **Legal Document Drafting Wizard**
   - Generates 6 standard editable legal document drafts:
     1. Residential Rental / Lease Agreement (Transfer of Property Act, 1882)
     2. Independent Contractor & Services Agreement (Indian Contract Act, 1872)
     3. General Legal Demand Notice (Section 73 of Indian Contract Act)
     4. Consumer Forum Complaint Draft (Section 35 of Consumer Protection Act, 2019)
     5. Employment Appointment Offer Letter
     6. General Sworn Affidavit Draft
   - Dynamic schema-driven forms with input validation (never requesting sensitive identifiers like Aadhaar or bank credentials).
   - Instant inline text editor and one-click download as **DOCX (Microsoft Word)** and **PDF (ReportLab)**.

3. **Statutory Knowledge Graph**
   - Interactive relational graph explorer linking Acts, Sections, Rules, and Topics.
   - Explicit traceability showing how BNS 2023 replaces the Indian Penal Code, 1860 with official gazette notification references.

4. **Privacy-by-Design Governance (GDPR / DPDP Act, 2023)**
   - Configurable automated data-retention horizons (30, 60, 90, 180, 365 days).
   - Full GDPR Article 20 / DPDP personal data export in portable JSON.
   - Instant conversation history clearing and permanent Right-to-be-Forgotten account erasure.

5. **Administrator Management Suite**
   - Document upload pipeline (.pdf and .txt) with chunking and automatic vector indexing.
   - User management and role-based access control (Admin, User, Legal Researcher).
   - User feedback logs with citation accuracy analytics.
   - Security audit logs tracking administrative and personal data operations.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS (Navy Blue, White & Gold), React Router, Lucide Icons, Axios, Recharts |
| **Backend** | Python 3.12+, FastAPI, Pydantic V2, SQLAlchemy 2.0, Alembic, Argon2 Password Hashing, JWT Auth |
| **Database** | SQLite (development fallback) / PostgreSQL 16 (production) |
| **Vector Search & NLP** | TF-IDF sublinear vectorizer & Cosine Similarity (Sentence Transformers extensible), Document Ingestion Pipeline |
| **Document Engine** | `python-docx` for editable Word documents, `ReportLab` for clean PDF generation |
| **Testing** | Pytest, Pytest-Asyncio, Fastapi TestClient (100% pass on 22 automated test suites) |
| **Containers** | Docker, Docker Compose, Nginx multi-stage build |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-repo/legalai.git
cd legalai
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ingest verified Indian statutes and seed initial templates/admin
python scripts/ingest_corpus.py

# Run backend development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at `http://127.0.0.1:8000`. Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

### 4. Default Seeded Credentials
- **Admin Email**: `admin@legalai.in`
- **Admin Password**: `AdminSecurePassword123!`
*(Or register a new account instantly via the UI).*

---

## Running Automated Tests & Benchmark Evaluation

### Pytest Suite
```bash
cd backend
.\venv\Scripts\pytest -v tests/
```
Output:
```
======================= 22 passed, 84 warnings in 3.19s =======================
```

### Retrieval Evaluation Benchmark
Measure Hit@1, Hit@3, and MRR against the verified evaluation dataset:
```bash
cd backend
.\venv\Scripts\python scripts/evaluate_rag.py
```
Output:
```
Total Evaluated Benchmark Queries : 6
Hit@1 Rate                        : 83.3%
Hit@3 Rate                        : 100.0%
Mean Reciprocal Rank (MRR)        : 0.917
```

---

## Docker Deployment

To launch the full production stack (PostgreSQL + FastAPI backend + Nginx React frontend):
```bash
docker-compose up --build -d
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## Statutory Disclaimer & Ethical AI

LegalAI is an automated software system intended solely for educational, informational, and preliminary document drafting purposes. 

1. **No Advocate-Client Relationship:** Using this platform does not constitute legal representation or establish an advocate-client privilege.
2. **Statutory Transition Notice:** References to Indian criminal laws reflect the Bharatiya Nyaya Sanhita, 2023, BNSS, 2023, and BSA, 2023 (enacted on 1 July 2024). Incidents occurring prior to this date remain governed by the repealed Indian Penal Code, 1860.
3. **Emergency Disclaimers:** LegalAI is not an emergency response system. For urgent police, cyber fraud, or women safety emergencies in India, dial **112** (National Emergency), **1930** (Cyber Crime Reporting), or **1091** (Women Helpline).
4. **Professional Review:** All generated document drafts must be verified by an enrolled advocate of the Bar Council of India for local state stamp duty, notarization, and registration compliance.
