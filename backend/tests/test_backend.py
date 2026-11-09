import pytest
from backend.database.session import SessionLocal
from backend.database.models import Researcher, Publication, School, ResearchTheme, Laboratory, InstitutionalResource
from backend.ai.embeddings import embedding_engine
from backend.ai.knowledge_graph import knowledge_graph_service
from backend.ai.clustering import theme_clustering_service
from backend.ai.recommender import recommender_service
from backend.ai.rag_pipeline import rag_pipeline
from backend.ai.evaluation import evaluation_service
from backend.routes.recommendations import get_researcher_full_dict

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_database_records(db):
    """Test that all required entities are present with proper counts and relationships."""
    schools_count = db.query(School).count()
    researchers_count = db.query(Researcher).count()
    publications_count = db.query(Publication).count()
    themes_count = db.query(ResearchTheme).count()
    labs_count = db.query(Laboratory).count()
    resources_count = db.query(InstitutionalResource).count()

    assert schools_count >= 6, f"Expected at least 6 schools, got {schools_count}"
    assert researchers_count >= 30, f"Expected at least 30 researchers, got {researchers_count}"
    assert publications_count >= 60, f"Expected at least 60 publications, got {publications_count}"
    assert themes_count >= 12, f"Expected at least 12 themes, got {themes_count}"
    assert labs_count >= 5, f"Expected at least 5 laboratories, got {labs_count}"
    assert resources_count >= 5, f"Expected at least 5 institutional resources, got {resources_count}"

def test_semantic_embedding_engine(db):
    """Test dense LSA embeddings, cosine similarity, and keyword baseline."""
    # Ensure engine is fitted on database corpus
    pubs = db.query(Publication.title, Publication.abstract).all()
    corpus = [f"{p[0]} {p[1]}" for p in pubs if p[0] and p[1]]
    embedding_engine.fit(corpus)

    text_ai = "Deep neural networks and convolutional computer vision for medical imaging"
    text_diag = "Radiological scan analysis using automated lesion detection algorithms"
    text_agri = "Precision agriculture soil moisture drip irrigation"

    vecs = embedding_engine.encode_dense([text_ai, text_diag, text_agri])
    assert vecs.shape[0] == 3
    assert vecs.shape[1] >= 10

    # Semantic similarity between AI medical and Radiological scan should be significantly higher than AI vs Agri
    sim_med = embedding_engine.compute_cosine_similarity(vecs[0], vecs[1])
    sim_agri = embedding_engine.compute_cosine_similarity(vecs[0], vecs[2])
    assert sim_med > sim_agri, f"Medical similarity ({sim_med}) should exceed agriculture similarity ({sim_agri})"

    # Keyword similarity test
    kw_sim = embedding_engine.compute_keyword_similarity(text_ai, text_diag)
    assert 0.0 <= kw_sim <= 1.0

def test_knowledge_graph_representation(db):
    """Test NetworkX knowledge graph nodes, links, and path discovery."""
    from backend.routes.graph import ensure_graph_initialized
    ensure_graph_initialized(db)

    graph_data = knowledge_graph_service.get_full_graph_data()
    assert graph_data["total_nodes"] >= 80
    assert graph_data["total_links"] >= 100

    node_types = set(n["type"] for n in graph_data["nodes"])
    assert "Researcher" in node_types
    assert "School" in node_types
    assert "ResearchTheme" in node_types
    assert "Publication" in node_types

    # Test path exploration between two researchers from different schools
    r1 = db.query(Researcher).filter(Researcher.name.like("%Aarav%")).first()
    r2 = db.query(Researcher).filter(Researcher.name.like("%Ananya%")).first()
    assert r1 is not None and r2 is not None

    paths = knowledge_graph_service.find_paths_between_researchers(r1.id, r2.id, max_depth=4)
    assert len(paths) > 0, "Expected at least 1 relationship path between Dr. Aarav and Dr. Ananya"

    # Test centrality
    centrality = knowledge_graph_service.get_centrality_metrics()
    assert len(centrality["top_hubs"]) > 0

def test_theme_clustering(db):
    """Test K-Means and Agglomerative theme clustering with Silhouette & Davies-Bouldin metrics."""
    themes = [{"id": t.id, "name": t.name, "category": t.category, "description": t.description} for t in db.query(ResearchTheme).all()]
    researchers = [{"id": r.id, "name": r.name, "school_name": r.school.name if r.school else "", "research_interests": r.research_interests} for r in db.query(Researcher).all()]

    cluster_result = theme_clustering_service.cluster_themes(themes, researchers)
    assert cluster_result["n_clusters"] == 5
    assert len(cluster_result["clusters"]) == 5
    assert "silhouette_score" in cluster_result
    assert "davies_bouldin_index" in cluster_result
    assert cluster_result["silhouette_score"] > 0.0
    assert cluster_result["davies_bouldin_index"] > 0.0

    # Ensure every cluster has a label and themes
    for c in cluster_result["clusters"]:
        assert len(c["label"]) > 0
        assert len(c["themes"]) > 0

def test_collaboration_recommendation_ranking(db):
    """Test multi-factor recommendation ranking, cross-school isolation, and score breakdown."""
    aarav = db.query(Researcher).filter(Researcher.name.like("%Aarav%")).first()
    assert aarav is not None
    aarav_dict = get_researcher_full_dict(aarav)

    all_researchers = [get_researcher_full_dict(r) for r in db.query(Researcher).all()]

    recommendations = recommender_service.recommend_for_researcher(
        target_researcher=aarav_dict,
        candidate_researchers=all_researchers,
        only_cross_school=True,
        top_k=5
    )

    assert len(recommendations) > 0
    top = recommendations[0]
    # Check that candidate is from a different school
    assert top["candidate_researcher"]["school_id"] != aarav.school_id
    # Check score properties
    assert 0.0 <= top["compatibility_score"] <= 1.0
    assert "score_breakdown" in top
    assert "semantic_similarity" in top["score_breakdown"]
    assert "shared_themes_score" in top["score_breakdown"]
    assert "publication_relevance" in top["score_breakdown"]
    assert "graph_connectivity" in top["score_breakdown"]
    assert "baseline_keyword_score" in top["score_breakdown"]

def test_rag_evidence_grounding_and_human_review(db):
    """Test that RAG extracts grounded facts and flags insufficient evidence on edge cases."""
    aarav = db.query(Researcher).filter(Researcher.name.like("%Aarav%")).first()
    ananya = db.query(Researcher).filter(Researcher.name.like("%Ananya%")).first()
    aarav_dict = get_researcher_full_dict(aarav)
    ananya_dict = get_researcher_full_dict(ananya)

    # 1. Normal interdisciplinary pair with supporting publications
    supporting = rag_pipeline.retrieve_supporting_publications(aarav_dict["publications"], ananya_dict["publications"], top_k=2)
    assert len(supporting) > 0
    assert "publication_a" in supporting[0]
    assert "publication_b" in supporting[0]
    assert len(supporting[0]["publication_a"]["abstract_excerpt"]) > 10

    explanation = rag_pipeline.generate_grounded_explanation(
        aarav_dict, ananya_dict, ["Healthcare Informatics"], supporting, overall_score=0.78
    )
    assert len(explanation["direct_facts"]) > 0
    assert len(explanation["inferred_synergies"]) > 0
    assert explanation["human_review_required"] is False

    # 2. Edge Case: Researcher with 0 publications and sparse profile
    edge_researcher = db.query(Researcher).filter(Researcher.name.like("%Edge Case%")).first()
    assert edge_researcher is not None
    edge_dict = get_researcher_full_dict(edge_researcher)

    edge_explanation = rag_pipeline.generate_grounded_explanation(
        aarav_dict, edge_dict, [], [], overall_score=0.35
    )
    # MUST trigger human review flag
    assert edge_explanation["human_review_required"] is True
    assert len(edge_explanation["missing_information"]) > 0
    assert "human_review_reason" in edge_explanation

def test_analytics_evaluation_benchmark(db):
    """Test comparative benchmark computation comparing Baseline vs Semantic vs Proposed Hybrid."""
    researchers_data = [get_researcher_full_dict(r) for r in db.query(Researcher).all()]
    themes_data = [{"id": t.id, "name": t.name, "category": t.category, "description": t.description} for t in db.query(ResearchTheme).all()]

    benchmark = evaluation_service.evaluate_all(researchers_data, themes_data)
    assert "comparison" in benchmark
    assert len(benchmark["comparison"]) == 3

    methods = [m["method"] for m in benchmark["comparison"]]
    assert any("Keyword Baseline" in m for m in methods)
    assert any("Semantic Similarity" in m for m in methods)
    assert any("Proposed Hybrid" in m for m in methods)

    for item in benchmark["comparison"]:
        assert 0.0 <= item["precision_at_3"] <= 1.0
        assert 0.0 <= item["precision_at_5"] <= 1.0
        assert 0.0 <= item["recall_at_5"] <= 1.0
        assert 0.0 <= item["f1_score"] <= 1.0
        assert item["latency_ms"] > 0.0

    assert len(benchmark["failure_patterns"]) >= 3
    assert len(benchmark["trade_offs"]) >= 3

def test_authentication_workflow(db):
    """Test user signup, password hashing, and token generation."""
    from backend.routes.auth import hash_password, verify_password, create_access_token, decode_access_token
    from backend.database.models import User

    test_pwd = "SecureResearchPassword123"
    hashed = hash_password(test_pwd)
    assert verify_password(test_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    # Check demo users exist
    demo_user = db.query(User).filter(User.email == "director@university.edu").first()
    assert demo_user is not None
    assert demo_user.role == "Research Director"

    # Token generation and decoding
    token = create_access_token(demo_user)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == demo_user.id
    assert payload["email"] == demo_user.email
