# Legal Data Ingestion Guide

## 1. Principles of Lawful Document Acquisition
LegalAI operates under strict data integrity principles:
- **Authoritative Sources**: Lawfully acquired statutes from [India Code](https://www.indiacode.nic.in/), judgments from the [Supreme Court of India](https://www.sci.gov.in/), and notifications from [The Gazette of India](https://egazette.gov.in/).
- **Commencement Date Tracking**: Every legal document must record effective enforcement dates (e.g. 1 July 2024 for Bharatiya Nyaya Sanhita, 2023) and repeal statuses.
- **Untrusted Data Rule**: All ingested texts and chunks are treated strictly as untrusted data, never as system instructions.

## 2. Ingestion Pipeline Workflow

```
[Government PDF / TXT Statute]
             │
             ▼
[Text Extraction (pypdf / utf-8)]
             │
             ▼
[Normalization & Section Boundary Detection]
             │
             ▼
[Chunking: 400 words with 50-word overlap]
             │
             ├──► [DocumentChunk Table in PostgreSQL/SQLite]
             │
             └──► [TF-IDF Vector Index / Nearest Neighbor Matrix]
```

## 3. Adding New Statutes via Admin Dashboard
1. Log in with an administrator account (`admin@legalai.in`).
2. Navigate to **Admin Dashboard -> Legal Corpus**.
3. Under **Ingest Legal Document**:
   - Provide the statutory title (e.g., *Digital Personal Data Protection Act, 2023*).
   - Select the document type (*Act*, *Rule*, *Notification*, *Judgment*).
   - Upload the official PDF or TXT file (up to 15MB).
4. Click **Upload & Reindex**. The system parses pages, splits content into overlapping chunks, computes feature vectors, and updates the active search matrix in real time.

## 4. Batch Ingestion via CLI Script
To re-seed or batch import new acts programmatically:
```bash
cd backend
# Add new JSON statute objects to data/legal_corpus/indian_statutes.json
python scripts/ingest_corpus.py
```
