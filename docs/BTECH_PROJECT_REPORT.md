# B.Tech Final Year Project Report Outline
## Project Title: LegalAI – AI-Driven Personalized Legal Assistance Platform for Indian Jurisdiction

---

### Abstract
With over 40 million pending cases in the Indian judicial hierarchy and frequent legislative transitions—including the repeal of the century-old Indian Penal Code (IPC 1860) by the Bharatiya Nyaya Sanhita (BNS 2023)—citizens and small business owners face acute legal information asymmetry. Conventional large language models (LLMs) suffer from severe legal hallucinations, frequently fabricating section numbers, obsolete acts, and non-existent precedent rulings.

This project presents **LegalAI**, an end-to-end, full-stack, retrieval-augmented generation (RAG) platform tailored for Indian statutory jurisprudence. Built using a decoupled React (TypeScript, Tailwind CSS) frontend and FastAPI (Python, SQLAlchemy, Argon2) backend, the system grounds natural-language inquiries in verified legislative texts from the India Code repository. A rule-based intent engine and vector similarity search achieve a **Hit@1 retrieval accuracy of 83.3%** and **Hit@3 accuracy of 100% (MRR: 0.917)** on the benchmark evaluation dataset. Additionally, LegalAI implements an automated legal document drafting wizard supporting DOCX and PDF generation, an interactive statutory knowledge graph detailing colonial code repeals, and GDPR/DPDP-aligned data sovereignty controls.

---

### Chapter 1: Introduction
1.1 Background and Context of Indian Legal Inquiries  
1.2 Motivation: Legal Asymmetry and Legislative Transitions (BNS, BNSS, BSA 2023)  
1.3 Problem Statement & Research Objectives  
1.4 Scope and Limitations (Educational & Informational Assistance vs Professional Representation)  
1.5 Thesis Organization  

---

### Chapter 2: Literature Review & Related Work
2.1 Traditional Legal Information Retrieval (India Code, SCC Online, Manupatra)  
2.2 Large Language Models in Specialized Domains  
2.3 The Hallucination Phenomenon in Legal AI: Risks and Liability  
2.4 Retrieval-Augmented Generation (RAG) Architectures  
2.5 Comparative Analysis of Existing LegalTech Solutions  

---

### Chapter 3: System Requirements & Architecture
3.1 Functional Requirements (Chatbot, Document Wizard, Knowledge Graph, Admin)  
3.2 Non-Functional Requirements (Latency, Privacy, Responsive Design, WCAG Accessibility)  
3.3 Three-Tier Architectural Design  
3.4 Technology Stack Justification:
   - Backend: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic V2
   - Frontend: Vite, React, TypeScript, Tailwind CSS
   - Security: Argon2 Hashing, JWT (HS256), IP Rate Limiting  
3.5 Database Schema Design and Entity Relationship (ER) Modeling  

---

### Chapter 4: AI Engine, Ingestion & RAG Retrieval
4.1 Authoritative Corpus Acquisition and Cleaning  
4.2 Normalization and Overlapping Chunking Strategy  
4.3 Vector Representation & Similarity Search (TF-IDF & Semantic Embeddings)  
4.4 Topic Classification and Prompt Injection Defense  
4.5 Zero-Hallucination Fallback Mechanism  
4.6 Legislative Transition Modeling: BNS 2023 vs IPC 1860, BNSS 2023 vs CrPC 1973  

---

### Chapter 5: Automated Document Drafting & Knowledge Graph
5.1 Reusable Legal Template Formulation (Rental, Service, Notice, Complaint, Offer, Affidavit)  
5.2 Pydantic Field Validation Schemas  
5.3 Document Rendering Pipeline:
   - `python-docx` for editable Microsoft Word files
   - `ReportLab` for printable PDF documents  
5.4 Graph Modeling of Legal Relationships: Nodes, Directed Edges, and Gazette References  
5.5 Interactive Frontend Network Explorer  

---

### Chapter 6: Privacy-by-Design & Responsible AI
6.1 Alignment with Digital Personal Data Protection (DPDP) Act, 2023 & GDPR  
6.2 Configurable Data Retention Horizons and Scheduled Purging  
6.3 Machine-Readable Data Portability (JSON Archive Export)  
6.4 Right to be Forgotten: Cascaded Deletion Workflows  
6.5 Persistent Legal Disclaimers & Emergency Escalation Protocols  

---

### Chapter 7: Testing, Evaluation & Results
7.1 Unit & Integration Testing using Pytest (22 Test Suites)  
7.2 Automated Evaluation Dataset Formulation  
7.3 Retrieval Performance Metrics (Hit@1: 83.3%, Hit@3: 100%, MRR: 0.917)  
7.4 Qualitative Answer Review & Citation Provenance Verification  
7.5 User Interface Usability Testing and Cross-Browser Accessibility  

---

### Chapter 8: Conclusion & Future Scope
8.1 Summary of Contributions  
8.2 Key Engineering Challenges Solved  
8.3 Limitations of Current System  
8.4 Future Enhancements:
   - Expansion to State-Specific High Court Judgments
   - Regional Language Support (Hindi, Tamil, Telugu, Marathi via Indic-BERT)
   - Fine-tuned Open-Source Legal LLMs on Indian Caselaw  

---

### References
- India Code Digital Repository (Ministry of Law and Justice, Government of India)
- The Gazette of India: Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)
- The Gazette of India: Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)
- Lewis, P., et al. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *NeurIPS*, 2020.
