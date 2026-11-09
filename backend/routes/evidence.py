import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import Researcher, Publication
from backend.ai.rag_pipeline import rag_pipeline
from backend.ai.knowledge_graph import knowledge_graph_service
from backend.ai.embeddings import embedding_engine
from backend.routes.recommendations import get_researcher_full_dict
from backend.routes.graph import ensure_graph_initialized

router = APIRouter(prefix="/evidence", tags=["Evidence Explorer"])

@router.get("/pair")
def get_collaboration_evidence(
    researcher_1_id: int,
    researcher_2_id: int,
    db: Session = Depends(get_db)
):
    ensure_graph_initialized(db)
    r1 = db.query(Researcher).filter(Researcher.id == researcher_1_id).first()
    r2 = db.query(Researcher).filter(Researcher.id == researcher_2_id).first()

    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both researchers not found")

    r1_dict = get_researcher_full_dict(r1)
    r2_dict = get_researcher_full_dict(r2)

    # 1. Retrieve supporting cross-publications via RAG
    supporting_pubs = rag_pipeline.retrieve_supporting_publications(
        r1_dict.get("publications", []),
        r2_dict.get("publications", []),
        top_k=4
    )

    # 2. Extract shared themes
    themes_1 = set([t.lower() for t in r1_dict.get("research_interests", [])])
    themes_2 = set([t.lower() for t in r2_dict.get("research_interests", [])])
    shared_themes = list(themes_1.intersection(themes_2))

    # 3. Compute semantic vector similarity
    t1_text = f"{r1.name} {r1.bio} {' '.join(r1_dict['research_interests'])}"
    t2_text = f"{r2.name} {r2.bio} {' '.join(r2_dict['research_interests'])}"
    v1 = embedding_engine.encode_dense([t1_text])[0]
    v2 = embedding_engine.encode_dense([t2_text])[0]
    semantic_sim = embedding_engine.compute_cosine_similarity(v1, v2)

    # 4. Compute overall score
    graph_score = knowledge_graph_service.compute_graph_connectivity_score(r1.id, r2.id)
    overall_score = round((semantic_sim * 0.4) + (0.3 if shared_themes else 0.05) + (graph_score * 0.3), 3)

    # 5. RAG synthesis
    explanation = rag_pipeline.generate_grounded_explanation(
        r1_dict, r2_dict, shared_themes, supporting_pubs, overall_score
    )

    # 6. Graph paths
    paths = knowledge_graph_service.find_paths_between_researchers(r1.id, r2.id, max_depth=4)

    return {
        "researcher_1": r1_dict,
        "researcher_2": r2_dict,
        "overall_compatibility_score": overall_score,
        "semantic_similarity": round(semantic_sim, 3),
        "graph_connectivity": round(graph_score, 3),
        "shared_themes": shared_themes,
        "explanation": explanation["summary"],
        "direct_facts": explanation["direct_facts"],
        "inferred_synergies": explanation["inferred_synergies"],
        "missing_information": explanation["missing_information"],
        "human_review_required": explanation["human_review_required"],
        "human_review_reason": explanation["human_review_reason"],
        "supporting_publications": supporting_pubs,
        "graph_relationship_paths": paths,
        "is_cross_school": r1.school_id != r2.school_id,
        "evidence_sufficiency": "Sufficient" if not explanation["human_review_required"] and supporting_pubs else "Insufficient supporting evidence"
    }
