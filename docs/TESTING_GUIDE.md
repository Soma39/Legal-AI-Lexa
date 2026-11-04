# Testing and Quality Assurance Guide

## 1. Test Architecture
LegalAI features a layered test architecture verifying all critical security, statutory retrieval, document generation, and privacy mechanisms.

- **Framework**: `pytest` with `pytest-asyncio` and `FastAPI TestClient`.
- **Database Isolation**: In-memory SQLite (`sqlite:///:memory:`) ensures tests are fast, deterministic, and isolated from production databases.

## 2. Test Suites
| Test File | Modules Tested |
|---|---|
| `test_auth.py` | Registration, duplicate checks, login, JWT validation, profile updates, Argon2 password changes |
| `test_chat_rag.py` | Multi-turn chat persistence, cited RAG retrieval, zero-hallucination verification, prompt injection defenses |
| `test_document_generation.py` | 6 drafting templates schema validation, draft saving/updating, DOCX binary generation, PDF binary generation |
| `test_knowledge_graph.py` | Statutory nodes, relational edges, BNS 2023 -> IPC 1860 repeal traceability, entity filtering |
| `test_privacy_admin.py` | Consent preferences, GDPR JSON export, right-to-be-forgotten deletion, RBAC restrictions |

## 3. Running Pytest
From the backend directory:
```bash
cd backend
.\venv\Scripts\pytest -v tests/
```

Expected result:
```
tests/test_auth.py ......................... [ 27%]
tests/test_chat_rag.py ..................... [ 50%]
tests/test_document_generation.py ......... [ 63%]
tests/test_knowledge_graph.py .............. [ 77%]
tests/test_privacy_admin.py ................ [100%]

======================= 22 passed in 3.19s =======================
```

## 4. RAG Retrieval Evaluation Benchmark
To test retrieval precision without subjective claims, run the automated benchmark:
```bash
python scripts/evaluate_rag.py
```
Target Metrics:
- **Hit@1**: >= 80% (Current: 83.3%)
- **Hit@3**: >= 95% (Current: 100.0%)
- **MRR (Mean Reciprocal Rank)**: >= 0.85 (Current: 0.917)
