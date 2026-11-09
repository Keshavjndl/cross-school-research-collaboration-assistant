import json
import time
from typing import List, Dict, Any, Optional
from backend.ai.embeddings import embedding_engine
from backend.ai.knowledge_graph import knowledge_graph_service
from backend.ai.rag_pipeline import rag_pipeline
from backend.app.config import settings

class CollaborationRecommender:
    """
    Core AI recommendation system that discovers and ranks interdisciplinary
    research collaboration opportunities across academic schools.
    """
    def __init__(self):
        pass

    def recommend_for_researcher(
        self,
        target_researcher: Dict[str, Any],
        candidate_researchers: List[Dict[str, Any]],
        filter_school_id: Optional[int] = None,
        only_cross_school: bool = True,
        weights: Optional[Dict[str, float]] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Ranks candidate researchers for a given target researcher.
        """
        w_semantic = weights.get("semantic", settings.SEMANTIC_SIMILARITY_WEIGHT) if weights else settings.SEMANTIC_SIMILARITY_WEIGHT
        w_theme = weights.get("theme", settings.SHARED_THEMES_WEIGHT) if weights else settings.SHARED_THEMES_WEIGHT
        w_pub = weights.get("pub", settings.PUBLICATION_RELEVANCE_WEIGHT) if weights else settings.PUBLICATION_RELEVANCE_WEIGHT
        w_graph = weights.get("graph", settings.GRAPH_CONNECTIVITY_WEIGHT) if weights else settings.GRAPH_CONNECTIVITY_WEIGHT

        # Target researcher text profile
        target_interests = target_researcher.get("research_interests", [])
        if isinstance(target_interests, str):
            try: target_interests = json.loads(target_interests)
            except: target_interests = [target_interests]
        target_skills = target_researcher.get("skills", [])
        if isinstance(target_skills, str):
            try: target_skills = json.loads(target_skills)
            except: target_skills = [target_skills]
            
        target_profile_text = (
            f"{target_researcher.get('name', '')} {target_researcher.get('bio', '')} "
            f"{' '.join(target_interests)} {' '.join(target_skills)}"
        )
        target_vec = embedding_engine.encode_dense([target_profile_text])[0]
        target_school_id = target_researcher.get("school_id")
        target_themes = set([t.lower() for t in target_interests])

        results = []

        for cand in candidate_researchers:
            if cand.get("id") == target_researcher.get("id"):
                continue  # Skip self

            cand_school_id = cand.get("school_id")
            # School filtering
            if filter_school_id and cand_school_id != filter_school_id:
                continue
            if only_cross_school and cand_school_id == target_school_id:
                continue  # Focus on cross-school

            # Candidate text profile
            c_interests = cand.get("research_interests", [])
            if isinstance(c_interests, str):
                try: c_interests = json.loads(c_interests)
                except: c_interests = [c_interests]
            c_skills = cand.get("skills", [])
            if isinstance(c_skills, str):
                try: c_skills = json.loads(c_skills)
                except: c_skills = [c_skills]

            cand_profile_text = (
                f"{cand.get('name', '')} {cand.get('bio', '')} "
                f"{' '.join(c_interests)} {' '.join(c_skills)}"
            )
            cand_vec = embedding_engine.encode_dense([cand_profile_text])[0]

            # 1. Semantic Similarity Score
            semantic_score = embedding_engine.compute_cosine_similarity(target_vec, cand_vec)

            # 2. Shared Themes Score (Jaccard + Overlap)
            cand_themes = set([t.lower() for t in c_interests])
            shared_themes_list = list(target_themes.intersection(cand_themes))
            theme_union = len(target_themes.union(cand_themes))
            theme_score = (len(shared_themes_list) / theme_union) if theme_union > 0 else 0.0
            # Scale theme score slightly if high semantic alignment exists
            if shared_themes_list:
                theme_score = min(1.0, theme_score + 0.3)

            # 3. Publication Relevance via Cross-Retrieval
            supporting_pubs = rag_pipeline.retrieve_supporting_publications(
                target_researcher.get("publications", []),
                cand.get("publications", []),
                top_k=2
            )
            pub_score = supporting_pubs[0]["similarity_score"] if supporting_pubs else (semantic_score * 0.4)

            # 4. Graph Connectivity Score
            graph_score = knowledge_graph_service.compute_graph_connectivity_score(
                target_researcher.get("id"), cand.get("id")
            )

            # 5. Combined Multi-Factor Score
            overall_score = (
                (semantic_score * w_semantic) +
                (theme_score * w_theme) +
                (pub_score * w_pub) +
                (graph_score * w_graph)
            )
            overall_score = round(min(1.0, max(0.05, overall_score)), 3)

            # 6. Baseline Keyword Score (for contrast & verification)
            baseline_keyword_score = embedding_engine.compute_keyword_similarity(
                target_profile_text, cand_profile_text
            )

            # 7. Generate RAG Grounded Explanation & Evidence
            explanation_data = rag_pipeline.generate_grounded_explanation(
                target_researcher,
                cand,
                shared_themes_list,
                supporting_pubs,
                overall_score
            )

            # Find relationship paths in knowledge graph
            graph_paths = knowledge_graph_service.find_paths_between_researchers(
                target_researcher.get("id"), cand.get("id"), max_depth=3
            )

            results.append({
                "target_researcher_id": target_researcher.get("id"),
                "candidate_researcher": {
                    "id": cand.get("id"),
                    "name": cand.get("name"),
                    "email": cand.get("email"),
                    "designation": cand.get("designation"),
                    "school_id": cand.get("school_id"),
                    "school_name": cand.get("school_name"),
                    "avatar_url": cand.get("avatar_url"),
                    "research_interests": c_interests,
                    "h_index": cand.get("h_index", 5),
                    "total_citations": cand.get("total_citations", 100),
                },
                "compatibility_score": overall_score,
                "score_breakdown": {
                    "semantic_similarity": round(semantic_score, 3),
                    "shared_themes_score": round(theme_score, 3),
                    "publication_relevance": round(pub_score, 3),
                    "graph_connectivity": round(graph_score, 3),
                    "baseline_keyword_score": round(baseline_keyword_score, 3)
                },
                "shared_themes": shared_themes_list,
                "explanation": explanation_data["summary"],
                "direct_facts": explanation_data["direct_facts"],
                "inferred_synergies": explanation_data["inferred_synergies"],
                "missing_information": explanation_data["missing_information"],
                "human_review_required": explanation_data["human_review_required"],
                "human_review_reason": explanation_data["human_review_reason"],
                "supporting_publications": supporting_pubs,
                "graph_paths": graph_paths[:2],
                "confidence_tier": "High" if overall_score >= settings.HIGH_CONFIDENCE_THRESHOLD else (
                    "Moderate" if overall_score >= settings.HUMAN_REVIEW_THRESHOLD else "Low / Exploratory"
                )
            })

        results.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return results[:top_k]

    def recommend_for_query(
        self,
        query: str,
        all_researchers: List[Dict[str, Any]],
        filter_school_id: Optional[int] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommends complementary pairs of researchers for an interdisciplinary query
        (e.g., 'AI-driven drug discovery' or 'IoT sensors in precision agriculture').
        """
        query_vec = embedding_engine.encode_dense([query])[0]
        scored_researchers = []

        for r in all_researchers:
            if filter_school_id and r.get("school_id") != filter_school_id:
                continue

            interests = r.get("research_interests", [])
            if isinstance(interests, str):
                try: interests = json.loads(interests)
                except: interests = [interests]

            profile_text = f"{r.get('name', '')} {r.get('bio', '')} {' '.join(interests)}"
            r_vec = embedding_engine.encode_dense([profile_text])[0]
            sim = embedding_engine.compute_cosine_similarity(query_vec, r_vec)
            kw_sim = embedding_engine.compute_keyword_similarity(query, profile_text)

            scored_researchers.append({
                "researcher": r,
                "similarity": sim,
                "kw_similarity": kw_sim
            })

        scored_researchers.sort(key=lambda x: x["similarity"], reverse=True)
        top_candidates = scored_researchers[:top_k]

        return [{
            "researcher": c["researcher"],
            "query_semantic_score": round(c["similarity"], 3),
            "query_keyword_score": round(c["kw_similarity"], 3),
            "match_reason": f"Profile & publications align with research theme concepts in '{query}'."
        } for c in top_candidates]

recommender_service = CollaborationRecommender()
