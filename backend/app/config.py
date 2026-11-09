import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Cross-School Research Collaboration Discovery & Evidence Mapping Assistant"
    INSTITUTION_NAME: str = "University Research & Innovation Office"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./research_collab.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "university-research-collab-jwt-secret-key-2025")
    CORS_ORIGINS: list[str] = ["*"]
    
    # Ranking Weights (Configurable)
    SEMANTIC_SIMILARITY_WEIGHT: float = 0.35
    SHARED_THEMES_WEIGHT: float = 0.25
    PUBLICATION_RELEVANCE_WEIGHT: float = 0.20
    GRAPH_CONNECTIVITY_WEIGHT: float = 0.20
    
    # Review & Confidence thresholds
    HUMAN_REVIEW_THRESHOLD: float = 0.45
    HIGH_CONFIDENCE_THRESHOLD: float = 0.70

settings = Settings()
