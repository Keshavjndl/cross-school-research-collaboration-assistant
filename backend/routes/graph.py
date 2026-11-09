import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import School, Researcher, Publication, ResearchTheme, Laboratory, InstitutionalResource
from backend.ai.knowledge_graph import knowledge_graph_service

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

def ensure_graph_initialized(db: Session):
    if not knowledge_graph_service.is_built:
        schools = [{"id": s.id, "name": s.name, "code": s.code, "building": s.building} for s in db.query(School).all()]
        themes = [{"id": t.id, "name": t.name, "category": t.category} for t in db.query(ResearchTheme).all()]
        labs = [{"id": l.id, "name": l.name, "school_id": l.school_id, "room_no": l.room_no} for l in db.query(Laboratory).all()]
        resources = [{"id": r.id, "name": r.name, "resource_type": r.resource_type, "school_id": r.school_id} for r in db.query(InstitutionalResource).all()]
        
        researchers = []
        for r in db.query(Researcher).all():
            researchers.append({
                "id": r.id,
                "name": r.name,
                "school_id": r.school_id,
                "school_name": r.school.name if r.school else "",
                "designation": r.designation,
                "h_index": r.h_index,
                "theme_ids": [t.id for t in r.themes],
                "publication_ids": [p.id for p in r.publications],
                "lead_lab_id": r.laboratories[0].id if r.laboratories else None
            })

        publications = []
        for p in db.query(Publication).all():
            publications.append({
                "id": p.id,
                "title": p.title,
                "school_id": p.school_id,
                "publication_year": p.publication_year,
                "citation_count": p.citation_count
            })

        knowledge_graph_service.build_graph(schools, researchers, publications, themes, labs, resources)

@router.get("/data")
def get_graph_data(
    node_type: str = Query("ALL", description="Filter node type: ALL, Researcher, School, ResearchTheme, Publication, Laboratory, InstitutionalResource"),
    school_id: int = Query(None, description="Filter nodes affiliated with school"),
    db: Session = Depends(get_db)
):
    ensure_graph_initialized(db)
    graph_data = knowledge_graph_service.get_full_graph_data()

    nodes = graph_data["nodes"]
    links = graph_data["links"]

    # Filter nodes if requested
    if node_type != "ALL":
        nodes = [n for n in nodes if n.get("type") == node_type]
        valid_node_ids = set(n["id"] for n in nodes)
        links = [l for l in links if l["source"] in valid_node_ids and l["target"] in valid_node_ids]

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links),
        "node_types": ["Researcher", "School", "ResearchTheme", "Publication", "Laboratory", "InstitutionalResource"]
    }

@router.get("/paths")
def get_collaboration_paths(
    researcher_1_id: int,
    researcher_2_id: int,
    max_depth: int = 4,
    db: Session = Depends(get_db)
):
    ensure_graph_initialized(db)
    paths = knowledge_graph_service.find_paths_between_researchers(researcher_1_id, researcher_2_id, max_depth)
    return {
        "researcher_1_id": researcher_1_id,
        "researcher_2_id": researcher_2_id,
        "total_paths_found": len(paths),
        "paths": paths
    }

@router.get("/centrality")
def get_centrality_metrics(db: Session = Depends(get_db)):
    ensure_graph_initialized(db)
    return knowledge_graph_service.get_centrality_metrics()
