import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import ResearchTheme, Researcher
from backend.ai.clustering import theme_clustering_service

router = APIRouter(prefix="/clusters", tags=["Theme Clustering"])

@router.get("/run")
def run_clustering(n_clusters: int = Query(5, ge=2, le=8), db: Session = Depends(get_db)):
    themes = db.query(ResearchTheme).all()
    themes_data = [{
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "description": t.description
    } for t in themes]

    researchers = db.query(Researcher).all()
    researchers_data = [{
        "id": r.id,
        "name": r.name,
        "school_name": r.school.name if r.school else "Unassigned",
        "research_interests": r.research_interests
    } for r in researchers]

    theme_clustering_service.n_clusters = n_clusters
    result = theme_clustering_service.cluster_themes(themes_data, researchers_data)

    # Persist cluster assignments back to DB themes for consistency
    for c in result.get("clusters", []):
        cid = c["cluster_id"]
        clabel = c["label"]
        theme_ids = [t["id"] for t in c.get("themes", [])]
        db.query(ResearchTheme).filter(ResearchTheme.id.in_(theme_ids)).update(
            {"cluster_id": cid, "cluster_label": clabel},
            synchronize_session=False
        )
    db.commit()

    return result
