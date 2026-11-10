import re
import logging
from typing import Dict, Any, List, Optional
from app.services.rag.vector_store import vector_store
from app.services.rag.llm_provider import llm_provider

logger = logging.getLogger(__name__)

TOPIC_KEYWORDS = {
    "Consumer Rights": [
        "consumer", "refund", "defective", "warranty", "seller", "e-commerce",
        "product", "complaint", "service charge", "daakhil", "deficiency"
    ],
    "Criminal Law Information": [
        "crime", "police", "fir", "arrest", "theft", "cheating", "bns", "ipc",
        "bail", "anticipatory", "punishment", "offence", "jail", "murder", "homicide",
        "snatching", "extortion", "robbery", "dacoity", "remand", "bnss"
    ],
    "Negotiable Instruments & Cheque Bounce": [
        "cheque", "check", "bounce", "dishonour", "138", "insufficient funds",
        "bank memo", "ni act", "statutory notice"
    ],
    "Property and Rental Matters": [
        "rent", "tenant", "landlord", "lease", "eviction", "security deposit",
        "property", "agreement", "tenancy", "tpa", "registration act"
    ],
    "Real Estate & Housing (RERA)": [
        "rera", "builder", "flat", "apartment", "possession", "allottee",
        "delayed possession", "promoter", "handover"
    ],
    "Contract Law": [
        "contract", "agreement", "breach", "damages", "clause", "penalty",
        "consideration", "valid agreement", "indemnity", "liquidated damages"
    ],
    "Cybercrime and Online Fraud": [
        "cyber", "fraud", "hacked", "phishing", "scam", "otp", "upi",
        "identity theft", "electronic evidence", "it act", "66d", "1930", "bsa 63"
    ],
    "Data Privacy (DPDP Act)": [
        "dpdp", "personal data", "data fiduciary", "data principal", "consent",
        "privacy", "erasure", "right to be forgotten", "data protection board"
    ],
    "Women's Safety & Domestic Violence": [
        "domestic violence", "pwdva", "maintenance", "cruelty", "harassment",
        "dowry", "shared household", "protection order", "modesty", "498a", "bns 85"
    ],
    "Right to Information": [
        "rti", "public information", "cpio", "spio", "information act", "30 days"
    ],
    "Motor Accident Claims": [
        "mact", "accident", "motor vehicle", "compensation", "hit and run", "insurance"
    ],
    "Employment & Labor Law": [
        "employment", "job", "salary", "termination", "resignation", "notice period",
        "retrenchment", "pf", "gratuity", "severance", "workman", "severance"
    ],
    "Constitutional & Free Legal Aid": [
        "legal aid", "nalsa", "article 39a", "slsa", "dlsa", "free lawyer", "indigent"
    ],
    "Civil Disputes": [
        "notice", "legal notice", "recovery", "suit", "affidavit", "injunction", "arbitration"
    ]
}


class LegalRAGService:
    """Enterprise RAG Service handling topic classification, retrieval, and cited legal response generation."""

    def detect_topic_and_intent(self, query: str) -> Dict[str, str]:
        """Rule-based topic and intent classifier for Indian legal matters."""
        q_lower = query.lower()

        detected_topic = "General Law"
        max_matches = 0

        for topic, keywords in TOPIC_KEYWORDS.items():
            matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', q_lower))
            if matches > max_matches:
                max_matches = matches
                detected_topic = topic

        # Intent detection
        if any(w in q_lower for w in ["how to", "procedure", "steps", "where to file", "process"]):
            intent = "PROCEDURAL_GUIDANCE"
        elif any(w in q_lower for w in ["what section", "which act", "punishment", "penalty", "statute", "bns", "bnss", "bsa", "ipc"]):
            intent = "STATUTORY_LOOKUP"
        elif any(w in q_lower for w in ["can i", "is it legal", "rights", "remedy", "relief", "compensation"]):
            intent = "RIGHTS_AND_REMEDIES"
        else:
            intent = "GENERAL_INQUIRY"

        return {"topic": detected_topic, "intent": intent}

    def check_prompt_injection(self, text: str) -> bool:
        """Scan for prompt injection patterns attempting system override."""
        injection_patterns = [
            r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
            r"system\s*prompt\s*override",
            r"you\s+are\s+now\s+dan",
            r"jailbreak",
            r"act\s+as\s+an\s+unrestricted",
            r"reveal\s+internal\s+prompt",
            r"forget\s+all\s+rules"
        ]
        t_lower = text.lower()
        for pat in injection_patterns:
            if re.search(pat, t_lower):
                return True
        return False

    async def answer_question(
        self,
        query: str,
        jurisdiction: str = "India",
        conversation_context: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main RAG pipeline:
        1. Validate query & security check
        2. Detect topic and intent
        3. Formulate query using conversation context if follow-up
        4. Retrieve relevant chunks from vector store
        5. Generate cited response via LLM provider
        """
        if self.check_prompt_injection(query):
            return {
                "answer": (
                    "**Security Notice:** Your input contained phrasing flagged as conflicting "
                    "with platform safety guidelines. LegalAI strictly operates within verified legal parameters "
                    "for educational and informational purposes only."
                ),
                "citations": [],
                "is_demo_mode": False,
                "confidence_score": 0.0,
                "disclaimer": "Informational notice only.",
                "topic": "Security / Policy",
                "intent": "RESTRICTED",
                "detected_jurisdiction": jurisdiction
            }

        topic_info = self.detect_topic_and_intent(query)
        topic = topic_info["topic"]
        intent = topic_info["intent"]

        # Build search query with conversational contextual enrichment
        search_query = query
        if conversation_context and len(query.split()) < 7:
            # If query is short follow-up (e.g. "what is the limitation?", "can police do that?"),
            # append preceding user query context for improved semantic retrieval
            prev_queries = [m.get("content", "") for m in conversation_context if m.get("role") == "user"]
            if prev_queries:
                search_query = f"{prev_queries[-1]} {query}"

        if topic != "General Law":
            search_query = f"{topic} {search_query}"

        retrieved_chunks = vector_store.search(
            query=search_query,
            top_k=4,
            min_score=0.06
        )

        # Fallback search if contextual search returned no chunks
        if not retrieved_chunks and search_query != query:
            retrieved_chunks = vector_store.search(
                query=query,
                top_k=4,
                min_score=0.06
            )

        # Strict hallucination guard: if jurisdiction is outside India or top match is below threshold
        if jurisdiction.lower() != "india" and (not retrieved_chunks or retrieved_chunks[0].get("score", 0) < 0.15):
            retrieved_chunks = []

        # Generate response using verified provider with multi-turn support
        result = await llm_provider.generate_response(
            query=query,
            retrieved_chunks=retrieved_chunks,
            topic=topic,
            jurisdiction=jurisdiction,
            conversation_context=conversation_context
        )

        result["topic"] = topic
        result["intent"] = intent
        result["detected_jurisdiction"] = jurisdiction
        return result


rag_service = LegalRAGService()
