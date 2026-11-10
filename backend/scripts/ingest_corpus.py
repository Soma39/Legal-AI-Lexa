import os
import sys
import json
import logging
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, LegalDocument, DocumentChunk, DocumentTemplate,
    KnowledgeNode, KnowledgeEdge, UserPrivacyPreference
)
from app.services.rag.vector_store import vector_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)


def seed_admin_user(db):
    admin = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if not admin:
        logger.info(f"Creating superuser: {settings.FIRST_SUPERUSER_EMAIL}")
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="LegalAI System Administrator",
            role=UserRole.ADMIN.value,
            is_superuser=True,
            is_active=True
        )
        db.add(admin)
        db.flush()
        
        pref = UserPrivacyPreference(
            user_id=admin.id,
            consent_data_retention=True,
            consent_personalization=True,
            analytics_opt_in=False,
            retention_days=365
        )
        db.add(pref)
        db.commit()


def seed_document_templates(db):
    """Seed the 6 standard document drafting templates required by the platform."""
    templates = [
        {
            "code": "residential_rental_agreement",
            "name": "Residential Rental / Lease Agreement",
            "category": "Property and Rental Matters",
            "description": "Standard residential tenancy agreement between landlord and tenant under Transfer of Property Act, 1882 and Model Tenancy Guidelines.",
            "purpose_and_limitations": "Drafting educational agreement for residential premises. For tenancies exceeding 11 months, mandatory registration and applicable state stamp duty are required under Section 17 of Registration Act, 1908.",
            "schema_json": {
                "fields": [
                    {"name": "landlord_name", "label": "Landlord Full Name", "type": "text", "required": True},
                    {"name": "landlord_address", "label": "Landlord Residential Address", "type": "textarea", "required": True},
                    {"name": "tenant_name", "label": "Tenant Full Name", "type": "text", "required": True},
                    {"name": "tenant_address", "label": "Tenant Permanent Address", "type": "textarea", "required": True},
                    {"name": "property_address", "label": "Rented Premises Address", "type": "textarea", "required": True},
                    {"name": "state_jurisdiction", "label": "State / Union Territory", "type": "text", "required": True, "placeholder": "e.g., Maharashtra, Karnataka, Delhi"},
                    {"name": "monthly_rent", "label": "Monthly Rent (INR)", "type": "number", "required": True},
                    {"name": "security_deposit", "label": "Security Deposit (INR)", "type": "number", "required": True},
                    {"name": "lease_term_months", "label": "Lease Term (in months)", "type": "number", "required": True, "default": 11},
                    {"name": "commencement_date", "label": "Agreement Commencement Date", "type": "date", "required": True},
                    {"name": "notice_period_days", "label": "Notice Period for Vacation (Days)", "type": "number", "required": True, "default": 30},
                    {"name": "maintenance_charge", "label": "Monthly Maintenance Charges (INR)", "type": "number", "required": False, "default": 0}
                ]
            }
        },
        {
            "code": "basic_service_agreement",
            "name": "Independent Contractor / Service Agreement",
            "category": "Contract Law",
            "description": "B2B or freelance service agreement governing deliverables, payment milestones, IP ownership, and confidentiality under the Indian Contract Act, 1872.",
            "purpose_and_limitations": "Suitable for independent contractors and commercial service providers. Does not establish an employer-employee relationship.",
            "schema_json": {
                "fields": [
                    {"name": "client_name", "label": "Client / Company Name", "type": "text", "required": True},
                    {"name": "client_address", "label": "Client Registered Address", "type": "textarea", "required": True},
                    {"name": "service_provider_name", "label": "Service Provider / Consultant Name", "type": "text", "required": True},
                    {"name": "service_provider_address", "label": "Service Provider Address", "type": "textarea", "required": True},
                    {"name": "scope_of_services", "label": "Scope of Services & Deliverables", "type": "textarea", "required": True},
                    {"name": "total_fee", "label": "Total Professional Fee (INR)", "type": "number", "required": True},
                    {"name": "payment_terms", "label": "Payment Terms & Milestones", "type": "textarea", "required": True},
                    {"name": "governing_state", "label": "Governing State Law", "type": "text", "required": True, "placeholder": "e.g., Delhi, Karnataka, Maharashtra"},
                    {"name": "effective_date", "label": "Effective Date", "type": "date", "required": True},
                    {"name": "completion_date", "label": "Target Completion Date", "type": "date", "required": True}
                ]
            }
        },
        {
            "code": "general_legal_notice",
            "name": "General Legal Notice (Demand for Dues / Breach)",
            "category": "Civil Disputes",
            "description": "Formal legal notice sent prior to initiating civil litigation, calling upon recipient to cure breach or pay outstanding dues within a specified time.",
            "purpose_and_limitations": "Draft notice for informational review. It is recommended that formal legal notices be issued on an advocate's letterhead for statutory compliance.",
            "schema_json": {
                "fields": [
                    {"name": "sender_name", "label": "Claimant / Sender Name", "type": "text", "required": True},
                    {"name": "sender_address", "label": "Sender Full Address", "type": "textarea", "required": True},
                    {"name": "recipient_name", "label": "Recipient / Defaulter Name", "type": "text", "required": True},
                    {"name": "recipient_address", "label": "Recipient Address", "type": "textarea", "required": True},
                    {"name": "dispute_summary", "label": "Summary of Dispute & Underlying Facts", "type": "textarea", "required": True},
                    {"name": "amount_due", "label": "Amount Due / Claimed (INR)", "type": "number", "required": True},
                    {"name": "cure_period_days", "label": "Time Given to Settle (Days)", "type": "number", "required": True, "default": 15},
                    {"name": "original_transaction_date", "label": "Original Transaction / Agreement Date", "type": "date", "required": True}
                ]
            }
        },
        {
            "code": "consumer_complaint_draft",
            "name": "Consumer Forum Complaint Draft",
            "category": "Consumer Rights",
            "description": "Complaint draft under Section 35 of the Consumer Protection Act, 2019 for deficiency in service or defect in goods.",
            "purpose_and_limitations": "Assistance draft for submission before District Consumer Disputes Redressal Commission or e-Daakhil online portal. Verify filing fees and limitation period (2 years from cause of action).",
            "schema_json": {
                "fields": [
                    {"name": "complainant_name", "label": "Complainant Full Name", "type": "text", "required": True},
                    {"name": "complainant_address", "label": "Complainant Address & Contact", "type": "textarea", "required": True},
                    {"name": "opposite_party_name", "label": "Opposite Party (Vendor/Company Name)", "type": "text", "required": True},
                    {"name": "opposite_party_address", "label": "Opposite Party Address", "type": "textarea", "required": True},
                    {"name": "goods_or_service_details", "label": "Goods Purchased or Services Hired", "type": "textarea", "required": True},
                    {"name": "consideration_paid", "label": "Total Amount Paid (INR)", "type": "number", "required": True},
                    {"name": "transaction_date", "label": "Date of Purchase / Invoice", "type": "date", "required": True},
                    {"name": "deficiency_description", "label": "Nature of Defect / Deficiency in Service", "type": "textarea", "required": True},
                    {"name": "relief_claimed", "label": "Specific Relief Claimed (Refund, Replacement, Compensation)", "type": "textarea", "required": True},
                    {"name": "district_jurisdiction", "label": "District Consumer Commission Location", "type": "text", "required": True}
                ]
            }
        },
        {
            "code": "employment_offer_letter",
            "name": "Employment Offer & Appointment Letter",
            "category": "Employment",
            "description": "Standard Indian corporate employment appointment draft covering compensation CTC, probation, confidentiality, and termination notice.",
            "purpose_and_limitations": "Standard template for professional hiring. High-level executive covenants or non-competes require tailored legal structuring under Section 27 of Indian Contract Act.",
            "schema_json": {
                "fields": [
                    {"name": "company_name", "label": "Company / Employer Name", "type": "text", "required": True},
                    {"name": "company_address", "label": "Company Registered Address", "type": "textarea", "required": True},
                    {"name": "candidate_name", "label": "Candidate Full Name", "type": "text", "required": True},
                    {"name": "candidate_address", "label": "Candidate Residential Address", "type": "textarea", "required": True},
                    {"name": "job_title", "label": "Designation / Job Role", "type": "text", "required": True},
                    {"name": "work_location", "label": "Work Location / Remote", "type": "text", "required": True},
                    {"name": "annual_ctc", "label": "Annual CTC (Gross INR)", "type": "number", "required": True},
                    {"name": "joining_date", "label": "Date of Joining", "type": "date", "required": True},
                    {"name": "probation_months", "label": "Probation Period (Months)", "type": "number", "required": True, "default": 3},
                    {"name": "notice_period_days", "label": "Notice Period after Confirmation (Days)", "type": "number", "required": True, "default": 60}
                ]
            }
        },
        {
            "code": "general_sworn_affidavit",
            "name": "General Sworn Affidavit Draft",
            "category": "Civil Disputes",
            "description": "Standard declaration of facts on oath before an Oath Commissioner or Notary Public under Indian law.",
            "purpose_and_limitations": "Model draft only. To have legal standing in India, an affidavit must be executed on non-judicial stamp paper of appropriate state value and sworn/attested before a Notary Public or Oath Commissioner.",
            "schema_json": {
                "fields": [
                    {"name": "deponent_name", "label": "Deponent (Your) Full Name", "type": "text", "required": True},
                    {"name": "deponent_age", "label": "Age of Deponent", "type": "number", "required": True},
                    {"name": "deponent_father_name", "label": "Son/Daughter/Spouse of", "type": "text", "required": True},
                    {"name": "deponent_address", "label": "Permanent Address", "type": "textarea", "required": True},
                    {"name": "purpose_of_affidavit", "label": "Purpose of Affidavit (e.g., Name Change, Address Proof, Lost Certificate)", "type": "text", "required": True},
                    {"name": "statement_points", "label": "Sworn Facts (Enter numbered points)", "type": "textarea", "required": True},
                    {"name": "place_of_swearing", "label": "Place of Execution (City/State)", "type": "text", "required": True},
                    {"name": "execution_date", "label": "Date of Deposition", "type": "date", "required": True}
                ]
            }
        }
    ]

    for t_data in templates:
        existing = db.query(DocumentTemplate).filter(DocumentTemplate.code == t_data["code"]).first()
        if not existing:
            tmpl = DocumentTemplate(
                code=t_data["code"],
                name=t_data["name"],
                category=t_data["category"],
                description=t_data["description"],
                purpose_and_limitations=t_data["purpose_and_limitations"],
                schema_json=t_data["schema_json"]
            )
            db.add(tmpl)
    db.commit()
    logger.info("Seeded document templates.")


def seed_legal_corpus_and_vector_store(db):
    corpus_file = os.path.join(backend_dir, "data", "legal_corpus", "indian_statutes.json")
    if not os.path.exists(corpus_file):
        logger.warning(f"Corpus file not found: {corpus_file}")
        return

    with open(corpus_file, "r", encoding="utf-8") as f:
        statutes = json.load(f)

    chunks_for_vector_store = []

    for item in statutes:
        # Check if doc exists in DB
        doc = db.query(LegalDocument).filter(LegalDocument.title == item["document_title"]).first()
        if not doc:
            doc = LegalDocument(
                title=item["document_title"],
                document_type=item.get("document_type", "Act"),
                jurisdiction=item.get("jurisdiction", "India"),
                publication_date=item.get("publication_date"),
                effective_date=item.get("effective_date"),
                amendment_status=item.get("amendment_status"),
                source_url=item.get("source_url"),
                ingestion_status="indexed",
                version="1.0",
                file_size=len(item["content"])
            )
            db.add(doc)
            db.flush()

        # Add chunk
        existing_chunk = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == doc.id,
            DocumentChunk.metadata_json["statute_name"].as_string() == item["statute_name"],
            DocumentChunk.metadata_json["section"].as_string() == item["section"]
        ).first()

        metadata = {
            "statute_name": item["statute_name"],
            "section": item["section"],
            "document_title": item["document_title"],
            "source_url": item["source_url"],
            "effective_date": item.get("effective_date", "2024-07-01"),
            "amendment_status": item.get("amendment_status", "")
        }

        if not existing_chunk:
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=0,
                content=item["content"],
                metadata_json=metadata,
                token_count=len(item["content"].split())
            )
            db.add(chunk)
            db.flush()
            chunk_id = chunk.id
        else:
            chunk_id = existing_chunk.id

        chunks_for_vector_store.append({
            "id": chunk_id,
            "document_id": doc.id,
            "title": item["document_title"],
            "statute": item["statute_name"],
            "section": item["section"],
            "content": f"{item['document_title']} - {item['section']}: {item['content']} (Status: {item.get('amendment_status', '')})",
            "source_url": item["source_url"],
            "effective_date": item.get("effective_date"),
            "amendment_status": item.get("amendment_status")
        })

    db.commit()
    # Add to vector store
    vector_store.add_chunks(chunks_for_vector_store, save=True)
    logger.info(f"Indexed {len(chunks_for_vector_store)} chunks into vector store.")


def seed_knowledge_graph(db):
    """Seed authoritative relationships between Acts, sections, rules, and topics."""
    nodes_data = [
        # Acts & Codes
        {"name": "Bharatiya Nyaya Sanhita, 2023", "type": "Act", "statute": "BNS, 2023", "desc": "Substantive penal code of India replacing IPC 1860, enacted 2023, effective 1 July 2024."},
        {"name": "Indian Penal Code, 1860", "type": "Act", "statute": "IPC, 1860", "desc": "Historical substantive criminal code of India, repealed by BNS 2023 as of 1 July 2024."},
        {"name": "Bharatiya Nagarik Suraksha Sanhita, 2023", "type": "Act", "statute": "BNSS, 2023", "desc": "Procedural criminal code of India replacing CrPC 1973, effective 1 July 2024."},
        {"name": "Code of Criminal Procedure, 1973", "type": "Act", "statute": "CrPC, 1973", "desc": "Historical procedural criminal code of India, repealed by BNSS 2023."},
        {"name": "Bharatiya Sakshya Adhiniyam, 2023", "type": "Act", "statute": "BSA, 2023", "desc": "Law of evidence in India replacing Indian Evidence Act 1872, effective 1 July 2024."},
        {"name": "Indian Evidence Act, 1872", "type": "Act", "statute": "IEA, 1872", "desc": "Colonial law of evidence in India, repealed by BSA 2023 on 1 July 2024."},
        {"name": "Consumer Protection Act, 2019", "type": "Act", "statute": "CPA, 2019", "desc": "Statute governing consumer rights, unfair trade practices, and consumer dispute redressal commissions."},
        {"name": "Information Technology Act, 2000", "type": "Act", "statute": "IT Act, 2000", "desc": "Legal recognition for electronic transactions, cybercrime penalties, and electronic evidence."},
        {"name": "Indian Contract Act, 1872", "type": "Act", "statute": "Contract Act, 1872", "desc": "Governs the law of contracts, agreements, consideration, and breach remedies in India."},
        {"name": "Transfer of Property Act, 1882", "type": "Act", "statute": "TPA, 1882", "desc": "Governs transfer of property and leases/tenancy in India."},
        {"name": "Registration Act, 1908", "type": "Act", "statute": "Registration Act, 1908", "desc": "Mandates compulsory registration of leases exceeding 11 months under Section 17."},
        {"name": "Negotiable Instruments Act, 1881", "type": "Act", "statute": "NI Act, 1881", "desc": "Governs cheques, promissory notes, and criminal liability for cheque dishonour under Section 138."},
        {"name": "Digital Personal Data Protection Act, 2023", "type": "Act", "statute": "DPDP, 2023", "desc": "Comprehensive digital privacy and data protection regulation in India."},
        {"name": "Real Estate (Regulation and Development) Act, 2016", "type": "Act", "statute": "RERA, 2016", "desc": "Homebuyer protection, developer project registration, and redressal for possession delays under Section 18."},
        {"name": "Protection of Women from Domestic Violence Act, 2005", "type": "Act", "statute": "PWDVA, 2005", "desc": "Provides immediate protection, residence orders, and monetary relief for aggrieved women."},
        {"name": "Right to Information Act, 2005", "type": "Act", "statute": "RTI Act, 2005", "desc": "Provides citizen access to public authority records within 30-day statutory timeline."},
        {"name": "Motor Vehicles Act, 1988", "type": "Act", "statute": "MVA, 1988", "desc": "Governs road safety, accident compensation claims before MACT, and hit-and-run relief."},
        {"name": "Legal Services Authorities Act, 1987", "type": "Act", "statute": "LSAA, 1987", "desc": "Enforces constitutional mandate for free legal aid under Article 39A via NALSA/SLSA/DLSA."},

        # Sections
        {"name": "BNS Section 318 (Cheating)", "type": "Section", "statute": "BNS, 2023", "section_number": "318", "desc": "Cheating and dishonestly inducing delivery of property (replaces IPC 420)."},
        {"name": "BNS Section 316 (Breach of Trust)", "type": "Section", "statute": "BNS, 2023", "section_number": "316", "desc": "Criminal breach of trust (replaces IPC 405/406)."},
        {"name": "BNS Section 303 (Theft)", "type": "Section", "statute": "BNS, 2023", "section_number": "303", "desc": "Theft and penalty; community service for first-time offenders under Rs. 5000 (replaces IPC 379)."},
        {"name": "BNS Section 304 (Snatching)", "type": "Section", "statute": "BNS, 2023", "section_number": "304", "desc": "Newly codified criminal offence for sudden forcible grabbing of property."},
        {"name": "BNS Section 103 (Murder & Mob Lynching)", "type": "Section", "statute": "BNS, 2023", "section_number": "103", "desc": "Capital punishment or life imprisonment for murder and group hate lynchings (replaces IPC 302)."},
        {"name": "BNS Section 106 (Hit and Run)", "type": "Section", "statute": "BNS, 2023", "section_number": "106", "desc": "Causing death by rash/negligent driving with up to 10 years imprisonment for fleeing scene."},
        {"name": "BNS Section 356 (Defamation)", "type": "Section", "statute": "BNS, 2023", "section_number": "356", "desc": "Defamation with community service or imprisonment up to 2 years (replaces IPC 499/500)."},
        {"name": "BNSS Section 173 (FIR & Zero FIR)", "type": "Section", "statute": "BNSS, 2023", "section_number": "173", "desc": "Registration of cognizable offences, statutory Zero FIR anywhere in India, and e-FIR (replaces CrPC 154)."},
        {"name": "BNSS Section 35 (Arrest Conditions)", "type": "Section", "statute": "BNSS, 2023", "section_number": "35", "desc": "Mandatory notice of appearance for offences under 7 years and arrest safeguards (replaces CrPC 41/41A)."},
        {"name": "BNSS Section 105 (Mandatory Videography)", "type": "Section", "statute": "BNSS, 2023", "section_number": "105", "desc": "Mandatory electronic audio-video recording of search and seizure operations."},
        {"name": "BNSS Section 479 (Undertrial Relief)", "type": "Section", "statute": "BNSS, 2023", "section_number": "479", "desc": "Mandatory bail for first-time offenders detained for 1/3rd of maximum sentence (replaces CrPC 436A)."},
        {"name": "BNSS Section 482 (Anticipatory Bail)", "type": "Section", "statute": "BNSS, 2023", "section_number": "482", "desc": "Anticipatory bail applications before Session Court / High Court (replaces CrPC 438)."},
        {"name": "BSA Section 63 (Electronic Evidence)", "type": "Section", "statute": "BSA, 2023", "section_number": "63", "desc": "Admissibility and electronic certificate requirement for digital records (replaces IEA 65B)."},
        {"name": "IT Act Section 66D (Cheating by Personation)", "type": "Section", "statute": "IT Act, 2000", "section_number": "66D", "desc": "Punishment for online fraud, phishing, and personation using computer resources."},
        {"name": "Contract Act Section 73 (Breach Compensation)", "type": "Section", "statute": "Contract Act, 1872", "section_number": "73", "desc": "Compensation for loss or damage caused by breach of contract."},
        {"name": "TPA Section 106 (Lease Notice)", "type": "Section", "statute": "TPA, 1882", "section_number": "106", "desc": "Statutory notice periods (15 days for residential, 6 months for manufacturing/agricultural)."},
        {"name": "NI Act Section 138 (Cheque Bounce)", "type": "Section", "statute": "NI Act, 1881", "section_number": "138", "desc": "Criminal liability for dishonour of cheque with up to 2 years imprisonment and double fine."},
        {"name": "DPDP Section 12 (Right to Erasure)", "type": "Section", "statute": "DPDP, 2023", "section_number": "12", "desc": "Right of Data Principal to erasure of personal data (Right to be Forgotten)."},
        {"name": "RERA Section 18 (Delayed Possession)", "type": "Section", "statute": "RERA, 2016", "section_number": "18", "desc": "Statutory refund with interest or monthly delay interest for delayed handover of flats."}
    ]

    node_map = {}
    for n in nodes_data:
        existing = db.query(KnowledgeNode).filter(KnowledgeNode.entity_name == n["name"]).first()
        if not existing:
            node = KnowledgeNode(
                entity_name=n["name"],
                entity_type=n["type"],
                statute_name=n.get("statute"),
                section_number=n.get("section_number"),
                description=n["desc"],
                source_url="https://www.indiacode.nic.in/"
            )
            db.add(node)
            db.flush()
            node_map[n["name"]] = node.id
        else:
            node_map[n["name"]] = existing.id

    edges_data = [
        ("Bharatiya Nyaya Sanhita, 2023", "Indian Penal Code, 1860", "REPLACES", "BNS 2023 came into force on 1 July 2024 repealing IPC 1860", "India Code Notification No. S.O. 850(E)"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "Code of Criminal Procedure, 1973", "REPLACES", "BNSS 2023 came into force on 1 July 2024 repealing CrPC 1973", "India Code Notification No. S.O. 848(E)"),
        ("Bharatiya Sakshya Adhiniyam, 2023", "Indian Evidence Act, 1872", "REPLACES", "BSA 2023 came into force on 1 July 2024 repealing Evidence Act 1872", "India Code Notification No. S.O. 849(E)"),
        ("Bharatiya Sakshya Adhiniyam, 2023", "Information Technology Act, 2000", "REFERENCES", "BSA 2023 harmonizes digital evidence admissibility with IT Act provisions", "BSA 2023 Section 61-63"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 318 (Cheating)", "CONTAINS", "BNS Chapter XVII contains Section 318 for cheating and fraud", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 316 (Breach of Trust)", "CONTAINS", "BNS Chapter XVII defines Criminal Breach of Trust", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 303 (Theft)", "CONTAINS", "BNS Section 303 codifies theft with community service option", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 304 (Snatching)", "CONTAINS", "BNS Section 304 creates explicit snatching offence", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 103 (Murder & Mob Lynching)", "CONTAINS", "BNS Section 103 prescribes murder and mob lynching penalties", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 106 (Hit and Run)", "CONTAINS", "BNS Section 106 prescribes penalties for negligent driving and hit-and-run", "Act No. 45 of 2023"),
        ("Bharatiya Nyaya Sanhita, 2023", "BNS Section 356 (Defamation)", "CONTAINS", "BNS Section 356 defines defamation with community service alternative", "Act No. 45 of 2023"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS Section 173 (FIR & Zero FIR)", "CONTAINS", "BNSS Section 173 governs FIR, Zero FIR, and e-FIR", "Act No. 46 of 2023"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS Section 35 (Arrest Conditions)", "CONTAINS", "BNSS Section 35 regulates arrest without warrant", "Act No. 46 of 2023"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS Section 105 (Mandatory Videography)", "CONTAINS", "BNSS Section 105 requires electronic recording of searches", "Act No. 46 of 2023"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS Section 479 (Undertrial Relief)", "CONTAINS", "BNSS Section 479 grants statutory bail for 1/3rd sentence undertrials", "Act No. 46 of 2023"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS Section 482 (Anticipatory Bail)", "CONTAINS", "BNSS Section 482 establishes anticipatory bail procedures", "Act No. 46 of 2023"),
        ("Information Technology Act, 2000", "IT Act Section 66D (Cheating by Personation)", "CONTAINS", "Chapter XI of IT Act defines online cheating offences", "Act No. 21 of 2000"),
        ("Indian Contract Act, 1872", "Contract Act Section 73 (Breach Compensation)", "CONTAINS", "Chapter VI provides remedies for breach of contract", "Act No. 9 of 1872"),
        ("Transfer of Property Act, 1882", "TPA Section 106 (Lease Notice)", "CONTAINS", "Chapter V governs leases of immovable property and eviction notice", "Act No. 4 of 1882"),
        ("Transfer of Property Act, 1882", "Registration Act, 1908", "REFERENCES", "Section 107 TPA requires registration under Registration Act Section 17", "Act No. 16 of 1908"),
        ("Negotiable Instruments Act, 1881", "NI Act Section 138 (Cheque Bounce)", "CONTAINS", "Chapter XVII penalizes dishonour of cheques for insufficiency of funds", "Act No. 26 of 1881"),
        ("Digital Personal Data Protection Act, 2023", "DPDP Section 12 (Right to Erasure)", "CONTAINS", "Chapter III guarantees Data Principal rights including Right to be Forgotten", "Act No. 22 of 2023"),
        ("Real Estate (Regulation and Development) Act, 2016", "RERA Section 18 (Delayed Possession)", "CONTAINS", "Chapter III mandates developer compensation for delayed possession", "Act No. 16 of 2016")
    ]

    for src_name, tgt_name, rel, desc, src_ref in edges_data:
        src_id = node_map.get(src_name)
        tgt_id = node_map.get(tgt_name)
        if src_id and tgt_id:
            existing = db.query(KnowledgeEdge).filter(
                KnowledgeEdge.source_node_id == src_id,
                KnowledgeEdge.target_node_id == tgt_id,
                KnowledgeEdge.relationship_type == rel
            ).first()
            if not existing:
                edge = KnowledgeEdge(
                    source_node_id=src_id,
                    target_node_id=tgt_id,
                    relationship_type=rel,
                    description=desc,
                    verified_source=src_ref
                )
                db.add(edge)

    db.commit()
    logger.info("Seeded legal knowledge graph.")


def main():
    logger.info("Starting LegalAI database and knowledge base ingestion...")
    init_db()
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_document_templates(db)
        seed_legal_corpus_and_vector_store(db)
        seed_knowledge_graph(db)
        logger.info("LegalAI initial knowledge ingestion completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
