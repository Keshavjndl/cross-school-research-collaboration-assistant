import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Search, Sliders, AlertTriangle, CheckCircle2,
  BookOpen, Building2, ExternalLink, ShieldAlert, Info, ArrowRight,
  HelpCircle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Researcher, School, RecommendationCard } from '../types';

export const CollaborationDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'researcher' | 'query'
  const [mode, setMode] = useState<'researcher' | 'query'>('researcher');

  // Input States
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [searchTopic, setSearchTopic] = useState<string>('AI-driven clinical diagnostic imaging and genomics');
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [onlyCrossSchool, setOnlyCrossSchool] = useState<boolean>(true);

  // Configurable Weights
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState({
    semantic: 0.35,
    theme: 0.25,
    pub: 0.20,
    graph: 0.20,
  });

  // Results State
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [targetInfo, setTargetInfo] = useState<any>(null);
  const [disclaimer, setDisclaimer] = useState<string>('');

  // Initial Load & URL Parameter Handling
  useEffect(() => {
    const init = async () => {
      const [resData, schoolsData] = await Promise.all([
        api.getResearchers(),
        api.getSchools(),
      ]);
      setResearchers(resData.researchers);
      setSchools(schoolsData);

      // Check URL search params for ?target_id=...
      const params = new URLSearchParams(location.search);
      const targetParam = params.get('target_id');
      if (targetParam) {
        setSelectedTargetId(targetParam);
        runDiscovery(Number(targetParam));
      } else if (resData.researchers.length > 0) {
        // Default select Dr. Aarav Mehta (CS Faculty)
        const defaultAarav = resData.researchers.find((r: Researcher) => r.name.includes('Aarav')) || resData.researchers[0];
        setSelectedTargetId(defaultAarav.id.toString());
        runDiscovery(defaultAarav.id);
      }
    };
    init();
  }, []);

  const runDiscovery = async (targetId = Number(selectedTargetId)) => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await api.discoverForResearcher({
        researcher_id: targetId,
        filter_school_id: filterSchoolId ? Number(filterSchoolId) : undefined,
        only_cross_school: onlyCrossSchool,
        weights,
        top_k: 8,
      });
      setRecommendations(res.recommendations);
      setTargetInfo(res.target_researcher);
      setDisclaimer(res.disclaimer);
    } catch (err: any) {
      alert(err.message || 'Error running discovery engine');
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySearch = async () => {
    if (!searchTopic.trim()) return;
    try {
      setLoading(true);
      const res = await api.discoverForQuery({
        query: searchTopic,
        filter_school_id: filterSchoolId ? Number(filterSchoolId) : undefined,
        top_k: 8,
      });
      setQueryResults(res.results);
    } catch (err: any) {
      alert(err.message || 'Error searching query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Cross-School Collaboration Discovery Engine
        </h2>
        <p className="text-xs text-slate-500">
          Identifies complementary interdisciplinary faculty partnerships using semantic vector matching,
          theme clustering, and knowledge graph relationship traversals.
        </p>
      </div>

      {/* Discovery Control Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Mode Toggle */}
        <div className="flex border-b border-slate-100 pb-3 gap-4">
          <button
            onClick={() => setMode('researcher')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
              mode === 'researcher'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Mode A: Select Target Faculty Member
          </button>
          <button
            onClick={() => setMode('query')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
              mode === 'query'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            Mode B: Research Problem Statement / Topic
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {mode === 'researcher' ? (
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Select University Faculty</label>
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  runDiscovery(Number(e.target.value));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {researchers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} &bull; {r.school_name} ({r.designation})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Enter Research Requirement / Topic</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="e.g. AI-driven targeted drug delivery, autonomous agricultural drones..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleQuerySearch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* School Filter */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Academic School</label>
            <select
              value={filterSchoolId}
              onChange={(e) => setFilterSchoolId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
            >
              <option value="">All Schools (Interdisciplinary)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkbox & Ranking Weights Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyCrossSchool}
              onChange={(e) => setOnlyCrossSchool(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">
              Prioritize Cross-School Opportunities (Exclude same-department faculty)
            </span>
          </label>

          <button
            onClick={() => setShowWeights(!showWeights)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showWeights ? 'Hide Ranking Weights' : 'Configure Ranking Formula Weights'}
          </button>
        </div>

        {/* Ranking Weights Tuning Sliders */}
        {showWeights && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mathematical Ranking Formula</span>
              <span className="text-[11px] text-slate-500">Weights normalize to 1.0</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">
                  Semantic Similarity: <strong>{weights.semantic}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.semantic}
                  onChange={(e) => setWeights({ ...weights, semantic: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Shared Themes: <strong>{weights.theme}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.theme}
                  onChange={(e) => setWeights({ ...weights, theme: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Publication Relevance: <strong>{weights.pub}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.pub}
                  onChange={(e) => setWeights({ ...weights, pub: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Graph Connectivity: <strong>{weights.graph}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.graph}
                  onChange={(e) => setWeights({ ...weights, graph: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Target Researcher Context Card (Mode A) */}
      {mode === 'researcher' && targetInfo && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
              {targetInfo.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">{targetInfo.name}</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                  {targetInfo.school_name}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Focus: {targetInfo.research_interests?.slice(0, 3).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => runDiscovery()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-evaluate
          </button>
        </div>
      )}

      {/* Scientific Disclaimer Banner */}
      {disclaimer && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      )}

      {/* Recommendations List */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          Ranking cross-school candidate pairs via semantic embeddings and RAG grounding...
        </div>
      ) : mode === 'researcher' ? (
        <div className="space-y-5">
          {recommendations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
              No matching cross-school candidates discovered with current filters. Try relaxing the school constraint.
            </div>
          ) : (
            recommendations.map((rec) => {
              const cand = rec.candidate_researcher;
              const percentScore = Math.round(rec.compatibility_score * 100);

              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4"
                >
                  {/* Top Header: Candidate Info & Compatibility Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 flex-shrink-0">
                        {cand.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base text-slate-900">{cand.name}</h3>
                          <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-full font-medium">
                            {cand.school_name}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-500">{cand.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>h-index: <strong>{cand.h_index}</strong></span>
                          <span>&bull;</span>
                          <span>Citations: <strong>{cand.total_citations}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Badge */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600 tracking-tight leading-none">
                          {percentScore}%
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Match Score
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        rec.confidence_tier === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.confidence_tier === 'Moderate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.confidence_tier}
                      </span>
                    </div>
                  </div>

                  {/* Transparent Score Breakdown Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Semantic Vector</span>
                      <strong className="text-slate-800">{rec.score_breakdown.semantic_similarity}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Shared Themes</span>
                      <strong className="text-slate-800">{rec.score_breakdown.shared_themes_score}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pub Relevance</span>
                      <strong className="text-slate-800">{rec.score_breakdown.publication_relevance}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Graph Proximity</span>
                      <strong className="text-slate-800">{rec.score_breakdown.graph_connectivity}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Baseline Keyword</span>
                      <strong className="text-slate-500">{rec.score_breakdown.baseline_keyword_score}</strong>
                    </div>
                  </div>

                  {/* Grounded RAG Narrative */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-slate-700 leading-relaxed">
                    <div className="font-semibold text-indigo-950 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Grounded Synthesis
                    </div>
                    <p>{rec.explanation}</p>
                  </div>

                  {/* Human Review Required Alert (When triggered by edge case or low evidence) */}
                  {rec.human_review_required && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Research Office Human Review Flagged:</strong>
                        <p className="text-[11px] mt-0.5 text-amber-800">{rec.human_review_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Supporting Publications Cross-Citations */}
                  {rec.supporting_publications && rec.supporting_publications.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        Supporting Publication Evidence ({rec.supporting_publications.length} cited works)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rec.supporting_publications.map((ev, eIdx) => (
                          <div key={eIdx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Match: {Math.round(ev.similarity_score * 100)}%</span>
                              {ev.publication_a.doi && <span>{ev.publication_a.doi}</span>}
                            </div>
                            <div className="font-semibold text-slate-900 text-xs leading-snug">
                              &bull; {ev.publication_a.title}
                            </div>
                            <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                              "{ev.publication_a.abstract_excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {rec.shared_themes.map((th) => (
                        <span key={th} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px]">
                          {th}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/evidence?r1=${targetInfo.id}&r2=${cand.id}`)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      Inspect Full Evidence Dossier <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Query Mode Results */
        <div className="space-y-4">
          {queryResults.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
              Enter a research problem topic above to search for cross-school faculty expertise.
            </div>
          ) : (
            queryResults.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900">{item.researcher.name}</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">
                      {item.researcher.school_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.match_reason}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">
                      {Math.round(item.query_semantic_score * 100)}%
                    </div>
                    <span className="text-[10px] text-slate-400">Semantic Fit</span>
                  </div>
                  <button
                    onClick={() => navigate(`/collaborations?target_id=${item.researcher.id}`)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Explore Collaborators
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
