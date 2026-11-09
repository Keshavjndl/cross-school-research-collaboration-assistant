from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import ResearchTheme

router = APIRouter(prefix="/themes", tags=["Research Themes"])

@router.get("")
def list_themes(db: Session = Depends(get_db)):
    themes = db.query(ResearchTheme).all()
    return [{
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "description": t.description,
        "cluster_id": t.cluster_id,
        "cluster_label": t.cluster_label,
        "researcher_count": len(t.researchers)
    } for t in themes]
