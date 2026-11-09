import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database.session import get_db
from backend.database.models import Researcher, School, Department, Publication, ResearchTheme

router = APIRouter(prefix="/researchers", tags=["Researchers"])

class ResearcherCreate(BaseModel):
    name: str
    email: str
    school_id: Optional[int] = None
    department_id: Optional[int] = None
    designation: Optional[str] = "Assistant Professor"
    avatar_url: Optional[str] = None
    bio: Optional[str] = ""
    research_interests: List[str] = []
    skills: List[str] = []
    keywords: List[str] = []
    availability_status: Optional[str] = "Available for Interdisciplinary Projects"
    h_index: Optional[int] = 5
    total_citations: Optional[int] = 100

def format_researcher(r: Researcher) -> dict:
    interests = []
    if r.research_interests:
        try: interests = json.loads(r.research_interests)
        except: interests = [r.research_interests]

    skills = []
    if r.skills:
        try: skills = json.loads(r.skills)
        except: skills = [r.skills]

    keywords = []
    if r.keywords:
        try: keywords = json.loads(r.keywords)
        except: keywords = [r.keywords]

    return {
        "id": r.id,
        "name": r.name,
        "email": r.email,
        "school_id": r.school_id,
        "school_name": r.school.name if r.school else "Unassigned",
        "school_code": r.school.code if r.school else "N/A",
        "department_id": r.department_id,
        "department_name": r.department.name if r.department else "Unassigned",
        "designation": r.designation,
        "avatar_url": r.avatar_url,
        "bio": r.bio,
        "research_interests": interests,
        "skills": skills,
        "keywords": keywords,
        "availability_status": r.availability_status,
        "h_index": r.h_index,
        "total_citations": r.total_citations,
        "publication_count": len(r.publications) if r.publications else 0,
        "is_active": r.is_active,
        "created_at": r.created_at.isoformat() if r.created_at else None
    }

@router.get("")
def list_researchers(
    search: Optional[str] = None,
    school_id: Optional[int] = None,
    theme: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Researcher)

    if school_id:
        query = query.filter(Researcher.school_id == school_id)

    researchers = query.all()
    results = [format_researcher(r) for r in researchers]

    # In-memory filtering for flexible JSON text matching
    if search:
        s_lower = search.lower()
        results = [
            r for r in results
            if s_lower in r["name"].lower()
            or s_lower in r["email"].lower()
            or any(s_lower in str(i).lower() for i in r["research_interests"])
            or any(s_lower in str(sk).lower() for i in r["skills"])
        ]

    if theme:
        t_lower = theme.lower()
        results = [
            r for r in results
            if any(t_lower in str(i).lower() for i in r["research_interests"])
        ]

    return {
        "total": len(results),
        "researchers": results[skip : skip + limit]
    }

@router.get("/{id}")
def get_researcher(id: int, db: Session = Depends(get_db)):
    r = db.query(Researcher).filter(Researcher.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Researcher not found")

    data = format_researcher(r)
    # Include publications
    data["publications"] = [
        {
            "id": p.id,
            "title": p.title,
            "abstract": p.abstract,
            "publication_year": p.publication_year,
            "doi": p.doi,
            "citations": p.citation_count,
            "themes": json.loads(p.themes) if p.themes else []
        }
        for p in r.publications
    ]
    return data

@router.post("")
def create_researcher(payload: ResearcherCreate, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(Researcher).filter(Researcher.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Researcher with this email already exists")

    new_r = Researcher(
        name=payload.name,
        email=payload.email,
        school_id=payload.school_id,
        department_id=payload.department_id,
        designation=payload.designation,
        avatar_url=payload.avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        bio=payload.bio,
        research_interests=json.dumps(payload.research_interests),
        skills=json.dumps(payload.skills),
        keywords=json.dumps(payload.keywords or (payload.research_interests + payload.skills)),
        availability_status=payload.availability_status,
        h_index=payload.h_index,
        total_citations=payload.total_citations,
    )
    db.add(new_r)
    db.commit()
    db.refresh(new_r)
    return format_researcher(new_r)

@router.put("/{id}")
def update_researcher(id: int, payload: ResearcherCreate, db: Session = Depends(get_db)):
    r = db.query(Researcher).filter(Researcher.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Researcher not found")

    r.name = payload.name
    r.email = payload.email
    r.school_id = payload.school_id
    r.department_id = payload.department_id
    r.designation = payload.designation
    if payload.avatar_url:
        r.avatar_url = payload.avatar_url
    r.bio = payload.bio
    r.research_interests = json.dumps(payload.research_interests)
    r.skills = json.dumps(payload.skills)
    r.keywords = json.dumps(payload.keywords)
    r.availability_status = payload.availability_status
    r.h_index = payload.h_index
    r.total_citations = payload.total_citations

    db.commit()
    db.refresh(r)
    return format_researcher(r)

@router.delete("/{id}")
def delete_researcher(id: int, db: Session = Depends(get_db)):
    r = db.query(Researcher).filter(Researcher.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Researcher not found")
    db.delete(r)
    db.commit()
    return {"message": "Researcher profile deleted successfully"}
