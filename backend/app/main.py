from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.database.session import engine, Base, SessionLocal
from backend.database.models import Researcher, Publication
from data.seed_data import seed_database
from backend.ai.embeddings import embedding_engine
from backend.routes.graph import ensure_graph_initialized

# Import all API routers
from backend.routes.researchers import router as researchers_router
from backend.routes.publications import router as publications_router
from backend.routes.schools import router as schools_router
from backend.routes.themes import router as themes_router
from backend.routes.graph import router as graph_router
from backend.routes.clusters import router as clusters_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.evidence import router as evidence_router
from backend.routes.analytics import router as analytics_router
from backend.routes.data_mgmt import router as data_mgmt_router
from backend.routes.auth import router as auth_router, ensure_seed_users

def init_app_state():
    """Initializes database schema, seed data, embedding model, and knowledge graph."""
    Base.metadata.create_all(bind=engine)
    seed_database()

    db = SessionLocal()
    try:
        pubs = db.query(Publication.title, Publication.abstract).all()
        corpus = [f"{p[0]} {p[1]}" for p in pubs if p[0] and p[1]]
        if corpus:
            embedding_engine.fit(corpus)
        ensure_graph_initialized(db)
        ensure_seed_users(db)
    finally:
        db.close()

# Initialize state at module load
init_app_state()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent system for discovering interdisciplinary faculty collaboration opportunities and mapping publication evidence across university schools.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(researchers_router, prefix=settings.API_V1_PREFIX)
app.include_router(publications_router, prefix=settings.API_V1_PREFIX)
app.include_router(schools_router, prefix=settings.API_V1_PREFIX)
app.include_router(themes_router, prefix=settings.API_V1_PREFIX)
app.include_router(graph_router, prefix=settings.API_V1_PREFIX)
app.include_router(clusters_router, prefix=settings.API_V1_PREFIX)
app.include_router(recommendations_router, prefix=settings.API_V1_PREFIX)
app.include_router(evidence_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(data_mgmt_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check if frontend/dist exists to mount production build
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

# Mount frontend production build AFTER all API routers so /api/... is never shadowed
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="spa")
else:
    @app.get("/")
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "problem_statement_id": settings.PROJECT_ID,
            "author": f"{settings.STUDENT_NAME} (Roll: {settings.ROLL_NO}, Reg: {settings.REGISTRATION_NO})",
            "status": "operational",
            "documentation": "/docs"
        }
