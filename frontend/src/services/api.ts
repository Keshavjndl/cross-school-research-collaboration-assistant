import {
  Researcher, Publication, School, Department, ResearchTheme,
  GraphData, ClusteringResult, RecommendationCard,
  DashboardMetrics, EvaluationData
} from '../types';

const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

export const api = {
  // Authentication
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to log in');
    }
    const data = await res.json();
    if (data.token) setAuthToken(data.token);
    return data;
  },

  signup: async (userData: { full_name: string; email: string; password: string; role?: string; department?: string; institution?: string }) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to sign up');
    }
    const data = await res.json();
    if (data.token) setAuthToken(data.token);
    return data;
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      removeAuthToken();
      return null;
    }
    return res.json();
  },

  getDemoAccounts: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return res.json();
  },

  // Dashboard & Analytics
  getDashboardOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to load dashboard overview');
    return res.json();
  },

  getEvaluationBenchmark: async (): Promise<EvaluationData> => {
    const res = await fetch(`${API_BASE}/analytics/evaluation`);
    if (!res.ok) throw new Error('Failed to load evaluation benchmark');
    return res.json();
  },

  // Researchers
  getResearchers: async (params?: { search?: string; school_id?: number; theme?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.school_id) query.append('school_id', params.school_id.toString());
    if (params?.theme) query.append('theme', params.theme);
    const res = await fetch(`${API_BASE}/researchers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch researchers');
    return res.json();
  },

  getResearcher: async (id: number): Promise<Researcher> => {
    const res = await fetch(`${API_BASE}/researchers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch researcher details');
    return res.json();
  },

  createResearcher: async (data: Partial<Researcher>) => {
    const res = await fetch(`${API_BASE}/researchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create researcher');
    }
    return res.json();
  },

  updateResearcher: async (id: number, data: Partial<Researcher>) => {
    const res = await fetch(`${API_BASE}/researchers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update researcher');
    }
    return res.json();
  },

  deleteResearcher: async (id: number) => {
    const res = await fetch(`${API_BASE}/researchers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete researcher');
    return res.json();
  },

  // Publications
  getPublications: async (params?: { search?: string; school_id?: number; year?: number; theme?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.school_id) query.append('school_id', params.school_id.toString());
    if (params?.year) query.append('year', params.year.toString());
    if (params?.theme) query.append('theme', params.theme);
    const res = await fetch(`${API_BASE}/publications?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch publications');
    return res.json();
  },

  createPublication: async (data: Partial<Publication>) => {
    const res = await fetch(`${API_BASE}/publications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create publication');
    }
    return res.json();
  },

  updatePublication: async (id: number, data: Partial<Publication>) => {
    const res = await fetch(`${API_BASE}/publications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update publication');
    }
    return res.json();
  },

  deletePublication: async (id: number) => {
    const res = await fetch(`${API_BASE}/publications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete publication');
    return res.json();
  },

  // Schools & Themes
  getSchools: async (): Promise<School[]> => {
    const res = await fetch(`${API_BASE}/schools`);
    if (!res.ok) throw new Error('Failed to fetch schools');
    return res.json();
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await fetch(`${API_BASE}/schools/departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  getThemes: async (): Promise<ResearchTheme[]> => {
    const res = await fetch(`${API_BASE}/themes`);
    if (!res.ok) throw new Error('Failed to fetch themes');
    return res.json();
  },

  // Knowledge Graph
  getGraphData: async (nodeType = 'ALL', schoolId?: number): Promise<GraphData> => {
    const query = new URLSearchParams({ node_type: nodeType });
    if (schoolId) query.append('school_id', schoolId.toString());
    const res = await fetch(`${API_BASE}/graph/data?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  getGraphPaths: async (r1: number, r2: number) => {
    const res = await fetch(`${API_BASE}/graph/paths?researcher_1_id=${r1}&researcher_2_id=${r2}`);
    if (!res.ok) throw new Error('Failed to fetch paths');
    return res.json();
  },

  getCentrality: async () => {
    const res = await fetch(`${API_BASE}/graph/centrality`);
    if (!res.ok) throw new Error('Failed to fetch centrality');
    return res.json();
  },

  // Theme Clustering
  runClustering: async (nClusters = 5): Promise<ClusteringResult> => {
    const res = await fetch(`${API_BASE}/clusters/run?n_clusters=${nClusters}`);
    if (!res.ok) throw new Error('Failed to run clustering');
    return res.json();
  },

  // Collaboration Recommendations
  discoverForResearcher: async (payload: {
    researcher_id: number;
    filter_school_id?: number;
    only_cross_school?: boolean;
    weights?: { semantic: number; theme: number; pub: number; graph: number };
    top_k?: number;
  }) => {
    const res = await fetch(`${API_BASE}/recommendations/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to discover collaborations');
    }
    return res.json();
  },

  discoverForQuery: async (payload: { query: string; filter_school_id?: number; top_k?: number }) => {
    const res = await fetch(`${API_BASE}/recommendations/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to search query recommendations');
    }
    return res.json();
  },

  getOpportunities: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/recommendations/opportunities${query}`);
    if (!res.ok) throw new Error('Failed to fetch opportunities');
    return res.json();
  },

  updateOpportunityReview: async (id: number, status: string, notes?: string) => {
    const res = await fetch(`${API_BASE}/recommendations/opportunities/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error('Failed to update review status');
    return res.json();
  },

  // Evidence Explorer
  getEvidencePair: async (r1: number, r2: number) => {
    const res = await fetch(`${API_BASE}/evidence/pair?researcher_1_id=${r1}&researcher_2_id=${r2}`);
    if (!res.ok) throw new Error('Failed to load evidence dossier');
    return res.json();
  },

  // CSV Import
  previewResearchersCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/data/import/researchers/preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to preview CSV');
    }
    return res.json();
  },

  confirmResearchersCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/data/import/researchers/confirm`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to import CSV');
    }
    return res.json();
  },
};
