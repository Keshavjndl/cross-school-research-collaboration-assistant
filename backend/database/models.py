import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from backend.database.session import Base

# Association Table for Researchers and Publications (Many-to-Many)
researcher_publications = Table(
    "researcher_publications",
    Base.metadata,
    Column("researcher_id", Integer, ForeignKey("researchers.id", ondelete="CASCADE"), primary_key=True),
    Column("publication_id", Integer, ForeignKey("publications.id", ondelete="CASCADE"), primary_key=True),
)

# Association Table for Researchers and Themes (Many-to-Many)
researcher_themes = Table(
    "researcher_themes",
    Base.metadata,
    Column("researcher_id", Integer, ForeignKey("researchers.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Integer, ForeignKey("research_themes.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="Research Officer")  # Research Officer, Faculty Researcher, Dean, Administrator
    institution = Column(String(200), default="University Research & Innovation Office")
    department = Column(String(150), nullable=True)
    avatar_url = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    dean_name = Column(String(100), nullable=True)
    established_year = Column(Integer, default=2005)
    building = Column(String(100), nullable=True)

    departments = relationship("Department", back_populates="school", cascade="all, delete-orphan")
    researchers = relationship("Researcher", back_populates="school")
    publications = relationship("Publication", back_populates="school")
    laboratories = relationship("Laboratory", back_populates="school")
    resources = relationship("InstitutionalResource", back_populates="school")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)

    school = relationship("School", back_populates="departments")
    researchers = relationship("Researcher", back_populates="department")

class Researcher(Base):
    __tablename__ = "researchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), default="Assistant Professor")
    avatar_url = Column(String(300), nullable=True)
    bio = Column(Text, nullable=True)
    research_interests = Column(Text, nullable=False, default="[]")  # JSON encoded list of strings
    skills = Column(Text, nullable=True, default="[]")               # JSON encoded list of strings
    keywords = Column(Text, nullable=True, default="[]")             # JSON encoded list of strings
    availability_status = Column(String(50), default="Available for Interdisciplinary Projects")
    h_index = Column(Integer, default=5)
    total_citations = Column(Integer, default=120)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    school = relationship("School", back_populates="researchers")
    department = relationship("Department", back_populates="researchers")
    publications = relationship("Publication", secondary=researcher_publications, back_populates="researchers")
    themes = relationship("ResearchTheme", secondary=researcher_themes, back_populates="researchers")
    laboratories = relationship("Laboratory", back_populates="lead_researcher")

class Publication(Base):
    __tablename__ = "publications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(350), nullable=False, index=True)
    abstract = Column(Text, nullable=False)
    authors = Column(Text, nullable=False, default="[]")             # JSON encoded list of strings
    publication_year = Column(Integer, default=2024, index=True)
    journal_or_conference = Column(String(250), nullable=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    doi = Column(String(150), nullable=True)
    citation_count = Column(Integer, default=0)
    keywords = Column(Text, nullable=True, default="[]")             # JSON encoded list of strings
    themes = Column(Text, nullable=True, default="[]")               # JSON encoded list of strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    school = relationship("School", back_populates="publications")
    researchers = relationship("Researcher", secondary=researcher_publications, back_populates="publications")

class ResearchTheme(Base):
    __tablename__ = "research_themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    cluster_id = Column(Integer, default=-1, index=True)
    cluster_label = Column(String(150), nullable=True)

    researchers = relationship("Researcher", secondary=researcher_themes, back_populates="themes")

class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    room_no = Column(String(50), nullable=True)
    focus_areas = Column(Text, default="[]")                         # JSON list
    equipment = Column(Text, default="[]")                           # JSON list
    lead_researcher_id = Column(Integer, ForeignKey("researchers.id", ondelete="SET NULL"), nullable=True)

    school = relationship("School", back_populates="laboratories")
    lead_researcher = relationship("Researcher", back_populates="laboratories")

class InstitutionalResource(Base):
    __tablename__ = "institutional_resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    resource_type = Column(String(100), default="Dataset")           # Dataset, Facility, Computing Cluster, Instrument
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    access_protocol = Column(String(200), default="Institutional Research Approval")

    school = relationship("School", back_populates="resources")

class CollaborationOpportunity(Base):
    __tablename__ = "collaboration_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    researcher_1_id = Column(Integer, ForeignKey("researchers.id", ondelete="CASCADE"), nullable=False)
    researcher_2_id = Column(Integer, ForeignKey("researchers.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Float, nullable=False)
    semantic_score = Column(Float, nullable=False)
    theme_score = Column(Float, nullable=False)
    publication_score = Column(Float, nullable=False)
    graph_score = Column(Float, nullable=False)
    shared_themes = Column(Text, default="[]")                       # JSON list
    explanation = Column(Text, nullable=False)
    evidence_summary = Column(Text, default="{}")                    # JSON object with supporting citations
    human_review_required = Column(Boolean, default=False)
    review_status = Column(String(50), default="Pending")            # Pending, Approved, Rejected, Human Review
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    researcher_1 = relationship("Researcher", foreign_keys=[researcher_1_id])
    researcher_2 = relationship("Researcher", foreign_keys=[researcher_2_id])

class EvaluationBenchmark(Base):
    __tablename__ = "evaluation_benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    method_name = Column(String(100), nullable=False)               # Keyword Baseline, Semantic Cosine, Hybrid Semantic+Graph
    precision_at_3 = Column(Float, default=0.0)
    precision_at_5 = Column(Float, default=0.0)
    recall_at_5 = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    mrr = Column(Float, default=0.0)
    recommendation_coverage = Column(Float, default=0.0)
    evidence_coverage = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)
    silhouette_score = Column(Float, nullable=True)
    davies_bouldin_index = Column(Float, nullable=True)
    evaluated_pairs_count = Column(Integer, default=0)
    run_date = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text, default="{}")                            # JSON breakdown
