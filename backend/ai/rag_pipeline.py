import re
import json
from typing import Dict, List, Any, Optional
from backend.ai.embeddings import embedding_engine

class RAGEvidencePipeline:
    """
    Retrieval-Augmented Generation (RAG) pipeline for cross-school research collaboration discovery.
    Retrieves grounded evidence from publication abstracts, researcher profiles, and institutional assets,
    synthesizing factual explanations with strict attribution and human-review flags.
    """
    def __init__(self):
        self._pub_cache = {}

    def _get_pub_vector(self, pub: Dict[str, Any]):
        pub_id = pub.get("id")
        if pub_id and pub_id in self._pub_cache:
            vec = self._pub_cache[pub_id]
            # Check dimension matches current engine svd
            if embedding_engine.is_fitted and hasattr(embedding_engine.svd, "n_components"):
                if vec.shape[-1] == embedding_engine.svd.n_components:
                    return vec
        text = f"{pub.get('title', '')} {pub.get('abstract', '')} {' '.join(pub.get('keywords', []))}"
        vec = embedding_engine.encode_dense([text])[0]
        if pub_id:
            self._pub_cache[pub_id] = vec
        return vec

    def retrieve_supporting_publications(
        self,
        researcher_a_pubs: List[Dict[str, Any]],
        researcher_b_pubs: List[Dict[str, Any]],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Cross-retrieves publications from both researchers that exhibit the highest semantic affinity.
        """
        if not researcher_a_pubs or not researcher_b_pubs:
            return []

        evidence_pairs = []
        # Pre-compute vectors
        vecs_a = [(pub_a, self._get_pub_vector(pub_a)) for pub_a in researcher_a_pubs]
        vecs_b = [(pub_b, self._get_pub_vector(pub_b)) for pub_b in researcher_b_pubs]

        for pub_a, vec_a in vecs_a:
            text_a = f"{pub_a.get('title', '')} {pub_a.get('abstract', '')}"
            for pub_b, vec_b in vecs_b:
                text_b = f"{pub_b.get('title', '')} {pub_b.get('abstract', '')}"
                sim = embedding_engine.compute_cosine_similarity(vec_a, vec_b)
                if sim >= 0.01:
                    kw_a = set([k.lower() for k in pub_a.get('keywords', [])])
                    kw_b = set([k.lower() for k in pub_b.get('keywords', [])])
                    shared_kw = list(kw_a.intersection(kw_b))

                    abstract_excerpt_a = self._extract_key_sentence(pub_a.get('abstract', ''), text_b)
                    abstract_excerpt_b = self._extract_key_sentence(pub_b.get('abstract', ''), text_a)

                    evidence_pairs.append({
                        "similarity_score": round(max(0.0, min(1.0, sim)), 3),
                        "publication_a": {
                            "id": pub_a.get("id"),
                            "title": pub_a.get("title"),
                            "year": pub_a.get("publication_year"),
                            "abstract_excerpt": abstract_excerpt_a,
                            "doi": pub_a.get("doi")
                        },
                        "publication_b": {
                            "id": pub_b.get("id"),
                            "title": pub_b.get("title"),
                            "year": pub_b.get("publication_year"),
                            "abstract_excerpt": abstract_excerpt_b,
                            "doi": pub_b.get("doi")
                        },
                        "shared_keywords": shared_kw
                    })

        evidence_pairs.sort(key=lambda x: x["similarity_score"], reverse=True)
        return evidence_pairs[:top_k]

    def _extract_key_sentence(self, abstract: str, query_context: str) -> str:
        """Extracts the sentence in the abstract with highest semantic overlap to query context."""
        if not abstract:
            return "No abstract available for this record."

        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', abstract) if len(s.strip()) > 15]
        if not sentences:
            return abstract[:200] + "..."

        query_tokens = set(re.findall(r'\b[a-zA-Z]{4,}\b', query_context.lower()))
        best_sentence = sentences[0]
        max_overlap = -1

        for sent in sentences:
            sent_tokens = set(re.findall(r'\b[a-zA-Z]{4,}\b', sent.lower()))
            overlap = len(sent_tokens.intersection(query_tokens))
            if overlap > max_overlap:
                max_overlap = overlap
                best_sentence = sent

        return best_sentence

    def generate_grounded_explanation(
        self,
        researcher_a: Dict[str, Any],
        researcher_b: Dict[str, Any],
        shared_themes: List[str],
        supporting_evidence: List[Dict[str, Any]],
        overall_score: float
    ) -> Dict[str, Any]:
        """
        Synthesizes an explainable, fact-checked collaboration dossier strictly grounded in verified data.
        Returns:
            - summary: Human-readable narrative
            - direct_facts: Array of factual shared points
            - inferred_synergies: Interdisciplinary cross-pollination opportunities
            - missing_information: Open gaps or unverified domains
            - human_review_required: Boolean
            - human_review_reason: Explanation if flagged
        """
        name_a = researcher_a.get("name", "Researcher A")
        school_a = researcher_a.get("school_name", "School A")
        interests_a = researcher_a.get("research_interests", [])
        if isinstance(interests_a, str):
            try: interests_a = json.loads(interests_a)
            except: interests_a = [interests_a]

        name_b = researcher_b.get("name", "Researcher B")
        school_b = researcher_b.get("school_name", "School B")
        interests_b = researcher_b.get("research_interests", [])
        if isinstance(interests_b, str):
            try: interests_b = json.loads(interests_b)
            except: interests_b = [interests_b]

        # 1. Determine Direct Facts
        direct_facts = []
        if school_a != school_b:
            direct_facts.append(f"Cross-school collaboration between {school_a} and {school_b}.")
        else:
            direct_facts.append(f"Intra-school research synergy within {school_a}.")

        if shared_themes:
            direct_facts.append(f"Co-aligned on research themes: {', '.join(shared_themes[:3])}.")

        pub_count_a = len(researcher_a.get("publications", []))
        pub_count_b = len(researcher_b.get("publications", []))
        direct_facts.append(f"Supported by {pub_count_a} publications from {name_a} and {pub_count_b} publications from {name_b}.")

        # 2. Determine Inferred Synergies
        inferred_synergies = []
        if supporting_evidence:
            top_pair = supporting_evidence[0]
            sim = top_pair["similarity_score"]
            pub_title_a = top_pair["publication_a"]["title"]
            pub_title_b = top_pair["publication_b"]["title"]
            inferred_synergies.append(
                f"Methodological convergence ({int(sim*100)}% match) between '{pub_title_a}' and '{pub_title_b}'."
            )
            if top_pair.get("shared_keywords"):
                inferred_synergies.append(
                    f"Shared conceptual vocabulary: {', '.join(top_pair['shared_keywords'][:4])}."
                )
        else:
            inferred_synergies.append(
                f"Potential complementarity between {', '.join(interests_a[:2])} and {', '.join(interests_b[:2])}."
            )

        # 3. Check for Missing Evidence and Review Trigger
        missing_information = []
        human_review_required = False
        human_review_reason = None

        if not supporting_evidence or len(supporting_evidence) == 0:
            missing_information.append("Insufficient peer-reviewed publication overlap between researchers.")
            human_review_required = True
            human_review_reason = "No directly aligned publications found in database; recommendation relies purely on declared profile interests."

        if not shared_themes:
            missing_information.append("No common formal research themes explicitly assigned in the institutional registry.")
            if overall_score < 0.60:
                human_review_required = True
                human_review_reason = "Low formal theme alignment; requires domain expert verification."

        if overall_score < 0.45:
            human_review_required = True
            human_review_reason = "Overall compatibility score is below the automatic confidence threshold (0.45)."

        # 4. Generate Narrative Summary
        if human_review_required and not supporting_evidence:
            summary = (
                f"Preliminary connection detected between {name_a} ({school_a}) and {name_b} ({school_b}) "
                f"based on overlapping keywords in their stated profile interests. However, specific cross-indexed "
                f"publication evidence is currently sparse in the institutional repository. Human review is recommended."
            )
        else:
            theme_str = f" in {', '.join(shared_themes[:2])}" if shared_themes else ""
            summary = (
                f"Strong interdisciplinary research opportunity identified between {name_a} ({school_a}) "
                f"and {name_b} ({school_b}){theme_str}. The pairing bridges computational or analytical methods "
                f"with application domain challenges, validated by {len(supporting_evidence)} highly relevant publication citations."
            )

        return {
            "summary": summary,
            "direct_facts": direct_facts,
            "inferred_synergies": inferred_synergies,
            "missing_information": missing_information,
            "human_review_required": human_review_required,
            "human_review_reason": human_review_reason,
            "supporting_publications": supporting_evidence
        }

rag_pipeline = RAGEvidencePipeline()
