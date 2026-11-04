import os
import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings

logger = logging.getLogger(__name__)


class LegalVectorStore:
    """
    High-performance, persistent vector store with TF-IDF semantic matching
    and extensible cosine-similarity retrieval for Indian legal documents.
    """
    _instance = None

    def __init__(self, storage_dir: str = settings.VECTOR_STORE_DIR):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.metadata_file = os.path.join(self.storage_dir, "chunks_metadata.json")
        self.vectorizer_file = os.path.join(self.storage_dir, "vectorizer_vocab.json")
        
        self.chunks: List[Dict[str, Any]] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix = None
        self._load_index()

    @classmethod
    def get_instance(cls) -> "LegalVectorStore":
        if cls._instance is None:
            cls._instance = LegalVectorStore()
        return cls._instance

    def _load_index(self):
        """Load stored chunks from disk if available."""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
                if self.chunks:
                    self._rebuild_matrix()
                logger.info(f"Loaded {len(self.chunks)} legal chunks into vector store.")
            except Exception as e:
                logger.error(f"Error loading vector index: {e}")
                self.chunks = []

    def _save_index(self):
        """Persist chunks to disk."""
        try:
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved {len(self.chunks)} chunks to vector index.")
        except Exception as e:
            logger.error(f"Error saving vector index: {e}")

    def _rebuild_matrix(self):
        """Fit vectorizer and build document-term matrix."""
        if not self.chunks:
            self.matrix = None
            self.vectorizer = None
            return

        corpus = [c["content"] for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=25000,
            sublinear_tf=True,
            stop_words='english'
        )
        self.matrix = self.vectorizer.fit_transform(corpus)

    def add_chunks(self, new_chunks: List[Dict[str, Any]], save: bool = True):
        """
        Add document chunks to index.
        Each chunk: {"id": str, "document_id": str, "title": str, "statute": str, 
                     "section": str, "content": str, "source_url": str, "effective_date": str}
        """
        existing_ids = {c["id"] for c in self.chunks}
        filtered = [c for c in new_chunks if c["id"] not in existing_ids]
        
        if not filtered:
            return

        self.chunks.extend(filtered)
        self._rebuild_matrix()
        if save:
            self._save_index()

    def remove_document_chunks(self, document_id: str):
        """Remove all chunks associated with a specific document."""
        self.chunks = [c for c in self.chunks if c.get("document_id") != document_id]
        self._rebuild_matrix()
        self._save_index()

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.05,
        statute_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search against indexed legal chunks.
        Returns top matching chunks with similarity scores.
        """
        if not self.chunks or self.vectorizer is None or self.matrix is None:
            return []

        try:
            query_vec = self.vectorizer.transform([query])
            scores = cosine_similarity(query_vec, self.matrix)[0]

            results = []
            for idx, score in enumerate(scores):
                if score < min_score:
                    continue
                chunk = self.chunks[idx].copy()
                chunk["score"] = float(round(score, 4))
                
                # Apply optional statute filter
                if statute_filter and statute_filter.lower() not in chunk.get("statute", "").lower():
                    continue

                results.append(chunk)

            # Sort descending by relevance score
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]
        except Exception as e:
            logger.error(f"Error during vector search: {e}")
            return []

    def get_chunk_count(self) -> int:
        return len(self.chunks)


vector_store = LegalVectorStore.get_instance()
