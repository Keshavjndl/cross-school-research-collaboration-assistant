export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  institution?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface School {
  id: number;
  name: string;
  code: string;
  dean_name?: string;
  building?: string;
  established_year?: number;
  researcher_count?: number;
  publication_count?: number;
  laboratory_count?: number;
  resource_count?: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  school_id: number;
  school_name?: string;
}

export interface Researcher {
  id: number;
  name: string;
  email: string;
  school_id: number;
  school_name: string;
  school_code: string;
  department_id?: number;
  department_name?: string;
  designation: string;
  avatar_url?: string;
  bio?: string;
  research_interests: string[];
  skills: string[];
  keywords: string[];
  availability_status: string;
  h_index: number;
  total_citations: number;
  publication_count?: number;
  publications?: Publication[];
  is_active?: boolean;
}

export interface Publication {
  id: number;
  title: string;
  abstract: string;
  authors: string[];
  publication_year: number;
  journal_or_conference?: string;
  school_id?: number;
  school_name?: string;
  school_code?: string;
  doi?: string;
  citation_count: number;
  keywords: string[];
  themes: string[];
}

export interface ResearchTheme {
  id: number;
  name: string;
  category: string;
  description: string;
  cluster_id?: number;
  cluster_label?: string;
  researcher_count?: number;
}

export interface GraphNode {
  id: string;
  entity_id: number;
  type: 'Researcher' | 'School' | 'ResearchTheme' | 'Publication' | 'Laboratory' | 'InstitutionalResource';
  name: string;
  code?: string;
  color?: string;
  size?: number;
  designation?: string;
  school_name?: string;
  category?: string;
  year?: number;
  citations?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  total_nodes: number;
  total_links: number;
}

export interface ClusterInfo {
  cluster_id: number;
  label: string;
  category: string;
  size: number;
  themes: ResearchTheme[];
  researchers: {
    id: number;
    name: string;
    school: string;
    matching_interests: string[];
  }[];
  researcher_count: number;
}

export interface ClusteringResult {
  n_clusters: number;
  silhouette_score: number;
  davies_bouldin_index: number;
  clusters: ClusterInfo[];
  inter_cluster_similarities: {
    cluster_a: string;
    cluster_b: string;
    similarity: number;
    synergy_type: string;
  }[];
  algorithm: string;
}

export interface SupportingPublication {
  similarity_score: number;
  publication_a: {
    id: number;
    title: string;
    year: number;
    abstract_excerpt: string;
    doi?: string;
  };
  publication_b: {
    id: number;
    title: string;
    year: number;
    abstract_excerpt: string;
    doi?: string;
  };
  shared_keywords: string[];
}

export interface RecommendationCard {
  target_researcher_id: number;
  candidate_researcher: Researcher;
  compatibility_score: number;
  score_breakdown: {
    semantic_similarity: number;
    shared_themes_score: number;
    publication_relevance: number;
    graph_connectivity: number;
    baseline_keyword_score: number;
  };
  shared_themes: string[];
  explanation: string;
  direct_facts: string[];
  inferred_synergies: string[];
  missing_information: string[];
  human_review_required: boolean;
  human_review_reason?: string;
  supporting_publications: SupportingPublication[];
  graph_paths: GraphNode[][];
  confidence_tier: 'High' | 'Moderate' | 'Low / Exploratory';
}

export interface DashboardMetrics {
  total_researchers: number;
  total_schools: number;
  total_publications: number;
  total_themes: number;
  total_collaborations: number;
  pending_reviews: number;
}

export interface BenchmarkComparison {
  method: string;
  precision_at_3: number;
  precision_at_5: number;
  recall_at_5: number;
  f1_score: number;
  mrr: number;
  recommendation_coverage: number;
  evidence_coverage: number;
  latency_ms: number;
}

export interface EvaluationData {
  dataset_info: {
    total_researchers_evaluated: number;
    total_themes_evaluated: number;
    benchmark_query_scenarios: number;
    ground_truth_methodology: string;
  };
  comparison: BenchmarkComparison[];
  clustering_evaluation: {
    silhouette_score: number;
    davies_bouldin_index: number;
    n_clusters: number;
    cluster_cohesion: string;
  };
  failure_patterns: {
    method: string;
    failure_type: string;
    description: string;
    example: string;
  }[];
  trade_offs: {
    dimension: string;
    baseline: string;
    semantic: string;
    hybrid: string;
    verdict: string;
  }[];
}
