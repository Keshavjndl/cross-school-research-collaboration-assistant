from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import School, Department, Researcher, Publication, Laboratory, InstitutionalResource

router = APIRouter(prefix="/schools", tags=["Schools"])

@router.get("")
def list_schools(db: Session = Depends(get_db)):
    schools = db.query(School).all()
    results = []
    for s in schools:
        results.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "dean_name": s.dean_name,
            "building": s.building,
            "established_year": s.established_year,
            "researcher_count": len(s.researchers),
            "publication_count": len(s.publications),
            "laboratory_count": len(s.laboratories),
            "resource_count": len(s.resources),
            "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in s.departments]
        })
    return results

@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "school_id": d.school_id,
        "school_name": d.school.name if d.school else "Unassigned"
    } for d in depts]
