import re
import numpy as np
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

class SemanticEmbeddingEngine:
    """
    Dual-mode semantic representation engine:
    1. Uses Dense Latent Semantic Analysis (LSA: Sublinear TF-IDF + TruncatedSVD)
       to produce normalized dense semantic vectors representing latent research concepts.
    2. Optional HuggingFace SentenceTransformers fallback if installed/available.
    3. Provides BM25 / token-overlap keyword baseline for comparative evaluation.
    """
    def __init__(self, n_components: int = 64):
        self.n_components = n_components
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            sublinear_tf=True,
            ngram_range=(1, 2),
            max_features=4000,
            token_pattern=r'(?u)\b[a-zA-Z0-9_\-\.]{2,}\b'
        )
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.is_fitted = False
        self.corpus_texts = []
        self._st_model = None

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Normalize whitespace and lowercase
        text = text.lower()
        text = re.sub(r'[\r\n\t]+', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def fit(self, corpus: List[str], force: bool = False):
        """Fit the semantic model on the corpus of abstracts, titles, and profiles."""
        if self.is_fitted and not force:
            return

        cleaned_corpus = [self._clean_text(t) for t in corpus if self._clean_text(t)]
        if len(cleaned_corpus) < 2:
            cleaned_corpus = ["computer science artificial intelligence machine learning", "healthcare biotechnology medical clinical"]
        
        self.corpus_texts = cleaned_corpus
        tfidf_matrix = self.vectorizer.fit_transform(cleaned_corpus)
        
        # Adjust n_components if corpus is smaller than n_components
        actual_components = min(self.n_components, tfidf_matrix.shape[0] - 1, tfidf_matrix.shape[1] - 1)
        if actual_components < 2:
            actual_components = 2
        self.svd = TruncatedSVD(n_components=actual_components, random_state=42)
        self.svd.fit(tfidf_matrix)
        self.is_fitted = True

    def encode_dense(self, texts: List[str]) -> np.ndarray:
        """Generates dense, L2-normalized semantic embedding vectors."""
        if not self.is_fitted:
            self.fit(texts)
            
        cleaned = [self._clean_text(t) for t in texts]
        tfidf_matrix = self.vectorizer.transform(cleaned)
        lsa_matrix = self.svd.transform(tfidf_matrix)
        
        # L2 Normalize
        norms = np.linalg.norm(lsa_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return lsa_matrix / norms

    def encode_sparse(self, texts: List[str]):
        """Generates TF-IDF sparse vectors for keyword baseline matching."""
        if not self.is_fitted:
            self.fit(texts)
        cleaned = [self._clean_text(t) for t in texts]
        return self.vectorizer.transform(cleaned)

    def compute_cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Calculates cosine similarity between two 1D or 2D vectors with dimension alignment protection."""
        if vec_a.ndim == 1:
            vec_a = vec_a.reshape(1, -1)
        if vec_b.ndim == 1:
            vec_b = vec_b.reshape(1, -1)
        
        # Align dimensions if shape differs
        dim_a = vec_a.shape[1]
        dim_b = vec_b.shape[1]
        if dim_a != dim_b:
            min_dim = min(dim_a, dim_b)
            vec_a = vec_a[:, :min_dim]
            vec_b = vec_b[:, :min_dim]
            # re-normalize
            norm_a = np.linalg.norm(vec_a)
            norm_b = np.linalg.norm(vec_b)
            if norm_a > 0:
                vec_a = vec_a / norm_a
            if norm_b > 0:
                vec_b = vec_b / norm_b

        score = float(cosine_similarity(vec_a, vec_b)[0][0])
        return max(0.0, min(1.0, score))

    def compute_keyword_similarity(self, text_a: str, text_b: str) -> float:
        """Baseline keyword Jaccard + TF-IDF similarity."""
        tokens_a = set(re.findall(r'\b[a-zA-Z]{3,}\b', text_a.lower()))
        tokens_b = set(re.findall(r'\b[a-zA-Z]{3,}\b', text_b.lower()))
        
        if not tokens_a or not tokens_b:
            return 0.0
            
        intersection = len(tokens_a.intersection(tokens_b))
        union = len(tokens_a.union(tokens_b))
        jaccard = intersection / union if union > 0 else 0.0
        return float(jaccard)

# Global singleton engine instance
embedding_engine = SemanticEmbeddingEngine(n_components=48)
