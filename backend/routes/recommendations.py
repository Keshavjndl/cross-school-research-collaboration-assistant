import json
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database.session import get_db
from backend.database.models import Researcher, Publication, School, CollaborationOpportunity
from backend.ai.recommender import recommender_service
from backend.routes.graph import ensure_graph_initialized

router = APIRouter(prefix="/recommendations", tags=["Collaboration Discovery"])

class DiscoverForResearcherRequest(BaseModel):
    researcher_id: int
    filter_school_id: Optional[int] = None
    only_cross_school: bool = True
    weights: Optional[Dict[str, float]] = None
    top_k: int = 10

class DiscoverForQueryRequest(BaseModel):
    query: str
    filter_school_id: Optional[int] = None
    top_k: int = 10

class ReviewStatusUpdate(BaseModel):
    status: str  # "Approved", "Rejected", "Human Review", "Pending"
    notes: Optional[str] = None

def get_researcher_full_dict(r: Researcher) -> dict:
    interests = json.loads(r.research_interests) if r.research_interests else []
    skills = json.loads(r.skills) if r.skills else []
    pubs = [
        {
            "id": p.id,
            "title": p.title,
            "abstract": p.abstract,
            "publication_year": p.publication_year,
            "doi": p.doi,
            "keywords": json.loads(p.keywords) if p.keywords else [],
            "themes": json.loads(p.themes) if p.themes else []
        }
        for p in r.publications
    ]
    return {
        "id": r.id,
        "name": r.name,
        "email": r.email,
        "school_id": r.school_id,
        "school_name": r.school.name if r.school else "Unassigned",
        "designation": r.designation,
        "avatar_url": r.avatar_url,
        "bio": r.bio,
        "research_interests": interests,
        "skills": skills,
        "publications": pubs,
        "h_index": r.h_index,
        "total_citations": r.total_citations,
    }

@router.post("/discover")
def discover_for_researcher(
    payload: DiscoverForResearcherRequest,
    db: Session = Depends(get_db)
):
    ensure_graph_initialized(db)
    target = db.query(Researcher).filter(Researcher.id == payload.researcher_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target researcher not found")

    all_researchers_orm = db.query(Researcher).all()
    target_dict = get_researcher_full_dict(target)
    candidates_dict = [get_researcher_full_dict(r) for r in all_researchers_orm]

    recommendations = recommender_service.recommend_for_researcher(
        target_researcher=target_dict,
        candidate_researchers=candidates_dict,
        filter_school_id=payload.filter_school_id,
        only_cross_school=payload.only_cross_school,
        weights=payload.weights,
        top_k=payload.top_k
    )

    # Persist top recommendations into CollaborationOpportunity table for dashboard audit tracking
    for rec in recommendations[:3]:
        cand_id = rec["candidate_researcher"]["id"]
        # Check if opportunity record exists
        existing = db.query(CollaborationOpportunity).filter(
            ((CollaborationOpportunity.researcher_1_id == target.id) & (CollaborationOpportunity.researcher_2_id == cand_id)) |
            ((CollaborationOpportunity.researcher_1_id == cand_id) & (CollaborationOpportunity.researcher_2_id == target.id))
        ).first()

        if not existing:
            opp = CollaborationOpportunity(
                researcher_1_id=target.id,
                researcher_2_id=cand_id,
                overall_score=rec["compatibility_score"],
                semantic_score=rec["score_breakdown"]["semantic_similarity"],
                theme_score=rec["score_breakdown"]["shared_themes_score"],
                publication_score=rec["score_breakdown"]["publication_relevance"],
                graph_score=rec["score_breakdown"]["graph_connectivity"],
                shared_themes=json.dumps(rec["shared_themes"]),
                explanation=rec["explanation"],
                evidence_summary=json.dumps(rec["supporting_publications"]),
                human_review_required=rec["human_review_required"],
                review_status="Human Review" if rec["human_review_required"] else "Pending"
            )
            db.add(opp)
            db.commit()

    return {
        "target_researcher": target_dict,
        "total_recommendations": len(recommendations),
        "disclaimer": "Scientific Disclaimer: Compatibility scores reflect algorithmic semantic affinity, shared institutional themes, and publication co-occurrence. They do not constitute a guaranteed predictor of interpersonal collaboration success.",
        "recommendations": recommendations
    }

@router.post("/query")
def discover_for_query(
    payload: DiscoverForQueryRequest,
    db: Session = Depends(get_db)
):
    if not payload.query or len(payload.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query must be at least 3 characters long")

    ensure_graph_initialized(db)
    all_researchers_orm = db.query(Researcher).all()
    candidates_dict = [get_researcher_full_dict(r) for r in all_researchers_orm]

    results = recommender_service.recommend_for_query(
        query=payload.query,
        all_researchers=candidates_dict,
        filter_school_id=payload.filter_school_id,
        top_k=payload.top_k
    )

    return {
        "query": payload.query,
        "total_matches": len(results),
        "results": results
    }

@router.get("/opportunities")
def list_collaboration_opportunities(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CollaborationOpportunity)
    if status:
        query = query.filter(CollaborationOpportunity.review_status == status)

    opps = query.order_by(CollaborationOpportunity.overall_score.desc()).all()
    results = []
    for o in opps:
        results.append({
            "id": o.id,
            "researcher_1": {
                "id": o.researcher_1.id,
                "name": o.researcher_1.name,
                "school_name": o.researcher_1.school.name if o.researcher_1.school else ""
            },
            "researcher_2": {
                "id": o.researcher_2.id,
                "name": o.researcher_2.name,
                "school_name": o.researcher_2.school.name if o.researcher_2.school else ""
            },
            "overall_score": o.overall_score,
            "semantic_score": o.semantic_score,
            "theme_score": o.theme_score,
            "publication_score": o.publication_score,
            "graph_score": o.graph_score,
            "shared_themes": json.loads(o.shared_themes) if o.shared_themes else [],
            "explanation": o.explanation,
            "human_review_required": o.human_review_required,
            "review_status": o.review_status,
            "notes": o.notes,
            "created_at": o.created_at.isoformat() if o.created_at else None
        })
    return results

@router.put("/opportunities/{id}/review")
def update_opportunity_review(
    id: int,
    payload: ReviewStatusUpdate,
    db: Session = Depends(get_db)
):
    opp = db.query(CollaborationOpportunity).filter(CollaborationOpportunity.id == id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp.review_status = payload.status
    if payload.notes:
        opp.notes = payload.notes
    db.commit()
    db.refresh(opp)
    return {"message": "Opportunity review status updated", "status": opp.review_status}
