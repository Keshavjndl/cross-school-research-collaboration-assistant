import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, Sparkles, RefreshCw, BarChart2, Layers, CheckCircle2,
  Users, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { ClusteringResult, ClusterInfo } from '../types';

export const ThemeClusteringPage: React.FC = () => {
  const navigate = useNavigate();
  const [kClusters, setKClusters] = useState<number>(5);
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const fetchClustering = async (k = kClusters) => {
    try {
      setLoading(true);
      const res = await api.runClustering(k);
      setClusteringResult(res);
      if (res.clusters.length > 0 && selectedClusterId === null) {
        setSelectedClusterId(res.clusters[0].cluster_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClustering();
  }, []);

  const handleClusterCountChange = (newK: number) => {
    setKClusters(newK);
    fetchClustering(newK);
  };

  const activeCluster = clusteringResult?.clusters.find(
    (c) => c.cluster_id === selectedClusterId
  ) || clusteringResult?.clusters[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Research Theme Semantic Clustering</h2>
          <p className="text-xs text-slate-500">
            Machine learning thematic grouping (K-Means & Agglomerative) identifying complementary institutional competencies.
          </p>
        </div>

        {/* K Selector & Trigger */}
        <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-slate-700 pl-2">Cluster Count (k):</span>
          <div className="flex gap-1">
            {[3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => handleClusterCountChange(num)}
                className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                  kClusters === num
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchClustering(kClusters)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-cluster
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {clusteringResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Silhouette Score</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{clusteringResult.silhouette_score}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {clusteringResult.silhouette_score > 0.5 ? 'Dense, well-separated thematic clusters' : 'Moderate cluster cohesion'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Davies-Bouldin Index</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{clusteringResult.davies_bouldin_index}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Lower score indicates higher cluster isolation</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Clusters</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{clusteringResult.n_clusters}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Disciplinary & Interdisciplinary groupings</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Clustering Pipeline</span>
            <div className="text-xs font-bold text-slate-800 mt-2 truncate">{clusteringResult.algorithm.split('(')[0]}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sublinear TF-IDF + Latent Semantic Indexing</p>
          </div>
        </div>
      )}

      {/* Main Clustering View: Clusters List & Cluster Detail View */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Computing semantic cluster vectors...</div>
      ) : clusteringResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cluster Cards (Left col) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-800 mb-2">Discovered Thematic Clusters</h3>
            {clusteringResult.clusters.map((c) => {
              const isSelected = selectedClusterId === c.cluster_id;
              return (
                <div
                  key={c.cluster_id}
                  onClick={() => setSelectedClusterId(c.cluster_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-md ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded">
                      Cluster {c.cluster_id + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {c.themes.length} themes &bull; {c.researcher_count} faculty
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 leading-snug">{c.label}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.themes.slice(0, 3).map((t) => (
                      <span key={t.id} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Cluster Details & Faculty Roster (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {activeCluster && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                      Cluster {activeCluster.cluster_id + 1}
                    </span>
                    <span className="text-xs text-slate-500">Category: {activeCluster.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{activeCluster.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Synergistic research focus grouping {activeCluster.themes.length} university research themes.
                  </p>
                </div>

                {/* Themes in this cluster */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 mb-2.5">Associated University Themes</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCluster.themes.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="font-semibold text-xs text-slate-900">{t.name}</div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {t.description || 'Interdisciplinary university research theme.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Researchers in this cluster */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold text-slate-800">
                      Affiliated Faculty ({activeCluster.researchers.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">Cross-school faculty mapped to this cluster</span>
                  </div>

                  {activeCluster.researchers.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {activeCluster.researchers.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{r.name}</div>
                            <div className="text-[11px] text-slate-500">{r.school}</div>
                          </div>
                          <button
                            onClick={() => navigate(`/collaborations?target_id=${r.id}`)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] rounded flex items-center gap-1 transition-colors"
                          >
                            Explore <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No faculty mapped to this cluster yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Inter-Cluster Similarity Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h4 className="text-xs font-semibold text-slate-800 mb-1">Cross-Cluster Interdisciplinary Synergies</h4>
              <p className="text-[11px] text-slate-500 mb-4">
                Cosine affinity between cluster centroids showing high-potential inter-thematic collaborations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {clusteringResult.inter_cluster_similarities.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-[11px] truncate max-w-[200px]">
                        {item.cluster_a}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {item.similarity}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[10px]">&harr; {item.cluster_b}</div>
                    <div className="text-[10px] text-indigo-600 font-medium pt-1 border-t border-slate-200/60">
                      {item.synergy_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
