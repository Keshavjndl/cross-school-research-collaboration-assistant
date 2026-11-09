import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database.session import get_db
from backend.database.models import Publication, School, Researcher

router = APIRouter(prefix="/publications", tags=["Publications"])

class PublicationCreate(BaseModel):
    title: str
    abstract: str
    authors: List[str] = []
    publication_year: Optional[int] = 2024
    journal_or_conference: Optional[str] = "Interdisciplinary University Journal"
    school_id: Optional[int] = None
    doi: Optional[str] = None
    citation_count: Optional[int] = 0
    keywords: List[str] = []
    themes: List[str] = []
    author_ids: List[int] = []

def format_publication(p: Publication) -> dict:
    authors = []
    if p.authors:
        try: authors = json.loads(p.authors)
        except: authors = [p.authors]

    keywords = []
    if p.keywords:
        try: keywords = json.loads(p.keywords)
        except: keywords = [p.keywords]

    themes = []
    if p.themes:
        try: themes = json.loads(p.themes)
        except: themes = [p.themes]

    return {
        "id": p.id,
        "title": p.title,
        "abstract": p.abstract,
        "authors": authors,
        "publication_year": p.publication_year,
        "journal_or_conference": p.journal_or_conference,
        "school_id": p.school_id,
        "school_name": p.school.name if p.school else "Unassigned",
        "school_code": p.school.code if p.school else "N/A",
        "doi": p.doi,
        "citation_count": p.citation_count,
        "keywords": keywords,
        "themes": themes,
        "created_at": p.created_at.isoformat() if p.created_at else None
    }

@router.get("")
def list_publications(
    search: Optional[str] = None,
    school_id: Optional[int] = None,
    year: Optional[int] = None,
    theme: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Publication)

    if school_id:
        query = query.filter(Publication.school_id == school_id)
    if year:
        query = query.filter(Publication.publication_year == year)

    pubs = query.order_by(Publication.publication_year.desc()).all()
    results = [format_publication(p) for p in pubs]

    if search:
        s_lower = search.lower()
        results = [
            p for p in results
            if s_lower in p["title"].lower()
            or s_lower in p["abstract"].lower()
            or any(s_lower in a.lower() for a in p["authors"])
            or any(s_lower in k.lower() for k in p["keywords"])
        ]

    if theme:
        t_lower = theme.lower()
        results = [
            p for p in results
            if any(t_lower in th.lower() for th in p["themes"])
        ]

    return {
        "total": len(results),
        "publications": results[skip : skip + limit]
    }

@router.get("/{id}")
def get_publication(id: int, db: Session = Depends(get_db)):
    p = db.query(Publication).filter(Publication.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Publication not found")
    return format_publication(p)

@router.post("")
def create_publication(payload: PublicationCreate, db: Session = Depends(get_db)):
    pub = Publication(
        title=payload.title,
        abstract=payload.abstract,
        authors=json.dumps(payload.authors),
        publication_year=payload.publication_year,
        journal_or_conference=payload.journal_or_conference,
        school_id=payload.school_id,
        doi=payload.doi or f"10.1016/j.rescollab.2025.{hash(payload.title) % 10000}",
        citation_count=payload.citation_count,
        keywords=json.dumps(payload.keywords),
        themes=json.dumps(payload.themes),
    )
    db.add(pub)
    db.flush()

    if payload.author_ids:
        researchers = db.query(Researcher).filter(Researcher.id.in_(payload.author_ids)).all()
        for r in researchers:
            pub.researchers.append(r)

    db.commit()
    db.refresh(pub)
    return format_publication(pub)

@router.put("/{id}")
def update_publication(id: int, payload: PublicationCreate, db: Session = Depends(get_db)):
    p = db.query(Publication).filter(Publication.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Publication not found")

    p.title = payload.title
    p.abstract = payload.abstract
    p.authors = json.dumps(payload.authors)
    p.publication_year = payload.publication_year
    p.journal_or_conference = payload.journal_or_conference
    p.school_id = payload.school_id
    p.doi = payload.doi
    p.citation_count = payload.citation_count
    p.keywords = json.dumps(payload.keywords)
    p.themes = json.dumps(payload.themes)

    db.commit()
    db.refresh(p)
    return format_publication(p)

@router.delete("/{id}")
def delete_publication(id: int, db: Session = Depends(get_db)):
    p = db.query(Publication).filter(Publication.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Publication not found")
    db.delete(p)
    db.commit()
    return {"message": "Publication record deleted successfully"}
