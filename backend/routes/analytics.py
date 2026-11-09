import json
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import Researcher, Publication, School, ResearchTheme, CollaborationOpportunity
from backend.ai.evaluation import evaluation_service
from backend.routes.recommendations import get_researcher_full_dict

router = APIRouter(prefix="/analytics", tags=["Analytics & Evaluation"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Computes dynamic, live statistics from database records."""
    total_researchers = db.query(Researcher).count()
    total_schools = db.query(School).count()
    total_publications = db.query(Publication).count()
    total_themes = db.query(ResearchTheme).count()
    total_opportunities = db.query(CollaborationOpportunity).count()
    pending_reviews = db.query(CollaborationOpportunity).filter(
        CollaborationOpportunity.review_status.in_(["Pending", "Human Review"])
    ).count()

    # 1. Publications by year (Activity chart)
    pubs = db.query(Publication.publication_year).all()
    year_counts = Counter([p[0] for p in pubs if p[0]])
    activity_chart = [
        {"year": str(yr), "publications": year_counts.get(yr, 0)}
        for yr in sorted(year_counts.keys())
    ]

    # 2. Researchers by School
    schools = db.query(School).all()
    school_distribution = [
        {"school": s.name, "code": s.code, "researchers": len(s.researchers), "publications": len(s.publications)}
        for s in schools
    ]

    # 3. Theme distribution
    themes = db.query(ResearchTheme).all()
    theme_distribution = [
        {"theme": t.name, "category": t.category, "count": len(t.researchers)}
        for t in sorted(themes, key=lambda x: len(x.researchers), reverse=True)[:8]
    ]

    # 4. Cross-School Collaborations Identified
    opps = db.query(CollaborationOpportunity).order_by(CollaborationOpportunity.overall_score.desc()).all()
    top_collaborations = []
    for o in opps[:5]:
        top_collaborations.append({
            "id": o.id,
            "researcher_1_name": o.researcher_1.name,
            "researcher_1_school": o.researcher_1.school.name if o.researcher_1.school else "",
            "researcher_2_name": o.researcher_2.name,
            "researcher_2_school": o.researcher_2.school.name if o.researcher_2.school else "",
            "compatibility_score": o.overall_score,
            "status": o.review_status,
            "shared_themes": json.loads(o.shared_themes) if o.shared_themes else []
        })

    # 5. Recently added researchers
    recent_researchers = db.query(Researcher).order_by(Researcher.id.desc()).limit(5).all()
    recent_list = [
        {
            "id": r.id,
            "name": r.name,
            "school_name": r.school.name if r.school else "",
            "designation": r.designation,
            "h_index": r.h_index
        }
        for r in recent_researchers
    ]

    return {
        "metrics": {
            "total_researchers": total_researchers,
            "total_schools": total_schools,
            "total_publications": total_publications,
            "total_themes": total_themes,
            "total_collaborations": total_opportunities,
            "pending_reviews": pending_reviews
        },
        "activity_chart": activity_chart,
        "school_distribution": school_distribution,
        "theme_distribution": theme_distribution,
        "top_collaborations": top_collaborations,
        "recently_added_researchers": recent_list
    }

@router.get("/evaluation")
def run_evaluation_benchmark(db: Session = Depends(get_db)):
    """Executes empirical benchmark evaluating Baseline vs Semantic vs Proposed Hybrid."""
    researchers_orm = db.query(Researcher).all()
    themes_orm = db.query(ResearchTheme).all()

    researchers_data = [get_researcher_full_dict(r) for r in researchers_orm]
    themes_data = [{"id": t.id, "name": t.name, "category": t.category, "description": t.description} for t in themes_orm]

    benchmark_results = evaluation_service.evaluate_all(researchers_data, themes_data)
    return benchmark_results
