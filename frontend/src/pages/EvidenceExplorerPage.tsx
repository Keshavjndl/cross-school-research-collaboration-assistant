import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck2, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen,
  Share2, ArrowRight, Building2, UserCheck, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Researcher } from '../types';

export const EvidenceExplorerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [r1Id, setR1Id] = useState<string>('');
  const [r2Id, setR2Id] = useState<string>('');
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Pending');

  useEffect(() => {
    const init = async () => {
      const res = await api.getResearchers();
      setResearchers(res.researchers);

      const params = new URLSearchParams(location.search);
      const qR1 = params.get('r1');
      const qR2 = params.get('r2');

      if (qR1 && qR2) {
        setR1Id(qR1);
        setR2Id(qR2);
        fetchEvidence(Number(qR1), Number(qR2));
      } else if (res.researchers.length >= 2) {
        // Default select Dr. Aarav Mehta & Dr. Ananya Roy
        const aarav = res.researchers.find((r: any) => r.name.includes('Aarav')) || res.researchers[0];
        const ananya = res.researchers.find((r: any) => r.name.includes('Ananya')) || res.researchers[1];
        setR1Id(aarav.id.toString());
        setR2Id(ananya.id.toString());
        fetchEvidence(aarav.id, ananya.id);
      }
    };
    init();
  }, [location.search]);

  const fetchEvidence = async (r1 = Number(r1Id), r2 = Number(r2Id)) => {
    if (!r1 || !r2 || r1 === r2) return;
    try {
      setLoading(true);
      const res = await api.getEvidencePair(r1, r2);
      setEvidenceData(res);
      setReviewStatus(res.human_review_required ? 'Human Review' : 'Pending');
    } catch (err: any) {
      alert(err.message || 'Error loading evidence dossier');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async (newStatus: string) => {
    try {
      setReviewStatus(newStatus);
      alert(`Audit Status updated to: ${newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">RAG Evidence Explorer & Mapping</h2>
        <p className="text-xs text-slate-500">
          Transparent, verifiable audit trail supporting cross-school collaboration recommendations.
        </p>
      </div>

      {/* Researcher Pair Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 text-xs">
        <div className="flex-1 w-full">
          <label className="block text-slate-600 font-medium mb-1">Faculty Member 1</label>
          <select
            value={r1Id}
            onChange={(e) => {
              setR1Id(e.target.value);
              fetchEvidence(Number(e.target.value), Number(r2Id));
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            {researchers.map((r) => (
              <option key={r.id} value={r.id}>{r.name} &bull; {r.school_name}</option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-bold hidden md:inline self-end mb-2">&harr;</span>

        <div className="flex-1 w-full">
          <label className="block text-slate-600 font-medium mb-1">Faculty Member 2</label>
          <select
            value={r2Id}
            onChange={(e) => {
              setR2Id(e.target.value);
              fetchEvidence(Number(r1Id), Number(e.target.value));
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            {researchers.map((r) => (
              <option key={r.id} value={r.id}>{r.name} &bull; {r.school_name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchEvidence()}
          className="w-full md:w-auto px-4 py-2 self-end bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Audit Pair
        </button>
      </div>

      {/* Main Evidence Dossier */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">
          Retrieving grounded publications and computing graph paths...
        </div>
      ) : evidenceData ? (
        <div className="space-y-6">
          {/* Sufficiency Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            evidenceData.evidence_sufficiency === 'Sufficient'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              {evidenceData.evidence_sufficiency === 'Sufficient' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-semibold text-xs">
                  Evidence Sufficiency: {evidenceData.evidence_sufficiency}
                </h4>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {evidenceData.human_review_required
                    ? evidenceData.human_review_reason
                    : 'Grounded publication citations and thematic overlap successfully validated against institutional database.'}
                </p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-right flex-shrink-0">
              <span className="text-xl font-bold">
                {Math.round(evidenceData.overall_compatibility_score * 100)}%
              </span>
              <span className="block text-[10px] uppercase font-semibold">Affinity Score</span>
            </div>
          </div>

          {/* Side-by-Side Faculty Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faculty 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  {evidenceData.researcher_1.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{evidenceData.researcher_1.name}</h3>
                  <p className="text-slate-500 text-[11px]">{evidenceData.researcher_1.designation}</p>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1">
                <div><span className="text-slate-400">School:</span> <strong className="text-slate-800">{evidenceData.researcher_1.school_name}</strong></div>
                <div><span className="text-slate-400">h-index:</span> <strong className="text-slate-800">{evidenceData.researcher_1.h_index}</strong> &bull; {evidenceData.researcher_1.total_citations} citations</div>
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Focus Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {evidenceData.researcher_1.research_interests.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Faculty 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                  {evidenceData.researcher_2.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{evidenceData.researcher_2.name}</h3>
                  <p className="text-slate-500 text-[11px]">{evidenceData.researcher_2.designation}</p>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1">
                <div><span className="text-slate-400">School:</span> <strong className="text-slate-800">{evidenceData.researcher_2.school_name}</strong></div>
                <div><span className="text-slate-400">h-index:</span> <strong className="text-slate-800">{evidenceData.researcher_2.h_index}</strong> &bull; {evidenceData.researcher_2.total_citations} citations</div>
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Focus Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {evidenceData.researcher_2.research_interests.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grounded Evidence Synthesis Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Grounded Evidence Synthesis
            </h3>

            {/* Summary Narrative */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl leading-relaxed text-slate-800">
              <p className="font-medium text-xs text-indigo-950 mb-1">Synthesized Collaboration Hypothesis:</p>
              <p>{evidenceData.explanation}</p>
            </div>

            {/* 3 Categories: Facts, Synergies, Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Directly Supported Facts */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Directly Supported Facts
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {evidenceData.direct_facts.map((fact: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">&bull;</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Inferred Synergies */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                  <Share2 className="w-4 h-4" />
                  Inferred Research Synergies
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {evidenceData.inferred_synergies.map((syn: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">&bull;</span>
                      <span>{syn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Information / Gaps */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Unverified / Missing Data
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {evidenceData.missing_information.length > 0 ? (
                    evidenceData.missing_information.map((gap: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">&bull;</span>
                        <span>{gap}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">No significant data gaps detected.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Cited Supporting Publications */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Retrieved Supporting Publication Pairs ({evidenceData.supporting_publications.length})
              </h3>
              <span className="text-[11px] text-slate-500">Extractive grounding strictly from stored database</span>
            </div>

            {evidenceData.supporting_publications.length > 0 ? (
              <div className="space-y-3">
                {evidenceData.supporting_publications.map((ev: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">Citation Alignment #{idx + 1}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-[10px]">
                        Cross-Similarity: {Math.round(ev.similarity_score * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Publication A Excerpt */}
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Publication 1</span>
                        <div className="font-semibold text-slate-900 leading-snug">{ev.publication_a.title}</div>
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded">
                          "{ev.publication_a.abstract_excerpt}"
                        </p>
                      </div>

                      {/* Publication B Excerpt */}
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Publication 2</span>
                        <div className="font-semibold text-slate-900 leading-snug">{ev.publication_b.title}</div>
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded">
                          "{ev.publication_b.abstract_excerpt}"
                        </p>
                      </div>
                    </div>

                    {ev.shared_keywords && ev.shared_keywords.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-600">Common Vocabulary:</span>
                        {ev.shared_keywords.map((kw: string) => (
                          <span key={kw} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No direct publication citations available. Recommendation is preliminary.
              </div>
            )}
          </div>

          {/* Research Office Audit & Review Action Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Research Office Audit Action & Sign-off
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleUpdateReview('Approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-all"
              >
                Approve Collaboration Match
              </button>
              <button
                onClick={() => handleUpdateReview('Human Review')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-all"
              >
                Flag for Human Review
              </button>
              <button
                onClick={() => handleUpdateReview('Rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-all"
              >
                Reject / Discard Match
              </button>
              <span className="text-slate-500 text-[11px] ml-auto">
                Current Audit Status: <strong className="text-slate-900">{reviewStatus}</strong>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
