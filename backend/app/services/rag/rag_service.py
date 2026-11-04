import re
import logging
from typing import Dict, Any, List, Optional
from app.services.rag.vector_store import vector_store
from app.services.rag.llm_provider import llm_provider

logger = logging.getLogger(__name__)

TOPIC_KEYWORDS = {
    "Consumer Rights": ["consumer", "refund", "defective", "warranty", "seller", "e-commerce", "product", "complaint", "service charge", "daakhil"],
    "Criminal Law Information": ["crime", "police", "fir", "arrest", "theft", "cheating", "bns", "ipc", "bail", "anticipatory", "punishment", "offence", "jail"],
    "Property and Rental Matters": ["rent", "tenant", "landlord", "lease", "eviction", "security deposit", "property", "agreement", "tenancy", "tpa"],
    "Contract Law": ["contract", "agreement", "breach", "damages", "clause", "penalty", "consideration", "valid agreement"],
    "Cybercrime and Online Fraud": ["cyber", "fraud", "hacked", "phishing", "scam", "otp", "upi", "identity theft", "electronic evidence", "it act", "66d", "1930"],
    "Employment": ["employment", "job", "salary", "termination", "resignation", "notice period", "retrenchment", "pf", "gratuity", "severance", "workman"],
    "Civil Disputes": ["notice", "legal notice", "recovery", "suit", "affidavit", "injunction", "arbitration"],
    "Company and Business Law": ["company", "llp", "director", "incorporation", "shareholder", "compliance"]
}


class LegalRAGService:
    """Service handling topic detection, retrieval, and cited legal response generation."""

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
        if any(w in q_lower for w in ["how to", "procedure", "steps", "where to file"]):
            intent = "PROCEDURAL_GUIDANCE"
        elif any(w in q_lower for w in ["what section", "which act", "punishment", "penalty", "statute"]):
            intent = "STATUTORY_LOOKUP"
        elif any(w in q_lower for w in ["can i", "is it legal", "rights", "remedy"]):
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
            r"reveal\s+internal\s+prompt"
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
        Main pipeline:
        1. Validate query & security check
        2. Detect topic and intent
        3. Retrieve relevant chunks from vector store
        4. Generate cited response via LLM provider
        """
        if self.check_prompt_injection(query):
            return {
                "answer": (
                    "**Security Notice:** Your input contained phrasing flagged as potentially conflicting "
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

        # Retrieve relevant passages without prepending generic 'General Law'
        search_query = f"{topic} {query}" if topic != "General Law" else query
        retrieved_chunks = vector_store.search(
            query=search_query,
            top_k=4,
            min_score=0.06
        )

        # Generate response using verified provider
        result = await llm_provider.generate_response(
            query=query,
            retrieved_chunks=retrieved_chunks,
            topic=topic,
            jurisdiction=jurisdiction
        )

        result["topic"] = topic
        result["intent"] = intent
        result["detected_jurisdiction"] = jurisdiction
        return result


rag_service = LegalRAGService()
