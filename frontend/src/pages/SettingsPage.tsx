import React, { useState } from 'react';
import {
  Settings, GraduationCap, ShieldCheck, Database, Sliders,
  CheckCircle2, RefreshCw, Layers, Cpu, Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({
    semantic: 0.35,
    theme: 0.25,
    pub: 0.20,
    graph: 0.20,
  });

  const [humanReviewThreshold, setHumanReviewThreshold] = useState(0.45);
  const [highConfidenceThreshold, setHighConfidenceThreshold] = useState(0.70);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('System parameters updated successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Metadata</h2>
        <p className="text-xs text-slate-500">
          University project accreditation information, AI hyperparameters, and database diagnostics.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveStatus}
        </div>
      )}

      {/* Institutional Workspace & Account Profile */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Institutional Workspace & System Environment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Platform Name</span>
            <p className="font-bold text-slate-900 text-xs leading-tight">
              Cross-School Research Collaboration Discovery and Evidence Mapping Assistant
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Governing Body</span>
            <p className="font-bold text-indigo-700 font-mono text-sm">University Research & Innovation Council</p>
            <span className="text-[10px] text-slate-500">Academic Affairs & Interdisciplinary Grants</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">System Architecture</span>
            <p className="font-bold text-slate-900 text-xs">Decentralized Academic Ontology</p>
            <div className="text-[11px] text-slate-600 font-mono">
              Vector Space: 48-Dim Dense LSA
            </div>
            <div className="text-[11px] text-slate-600 font-mono">Graph Engine: NetworkX DiGraph</div>
          </div>
        </div>

        {/* Required Technology Areas */}
        <div className="pt-2">
          <span className="font-semibold text-slate-700 block mb-2 text-xs">Core Technology Stack:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'Semantic Network', desc: 'NetworkX directed multi-relational graph' },
              { name: 'Clustering', desc: 'K-Means & Agglomerative clustering' },
              { name: 'Retrieval-Augmented Generation (RAG)', desc: 'Extractive & grounded evidence synthesis' },
              { name: 'Knowledge Representation', desc: 'Ontology mapping schools, labs & resources' },
            ].map((tech) => (
              <div key={tech.name} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <div className="font-semibold text-indigo-900 text-xs">{tech.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Hyperparameter & Ranking Configuration */}
      <form onSubmit={handleSaveWeights} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Recommendation Scoring Weights & Thresholds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800 text-xs">Ranking Component Weights</h4>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Semantic Similarity Weight:</span>
                <span className="font-bold text-slate-900">{weights.semantic}</span>
              </div>
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
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Shared Research Themes Weight:</span>
                <span className="font-bold text-slate-900">{weights.theme}</span>
              </div>
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
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Publication Relevance Weight:</span>
                <span className="font-bold text-slate-900">{weights.pub}</span>
              </div>
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
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Knowledge Graph Proximity Weight:</span>
                <span className="font-bold text-slate-900">{weights.graph}</span>
              </div>
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

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800 text-xs">Review & Confidence Triggers</h4>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Human Review Threshold (Below triggers review):</span>
                <span className="font-bold text-amber-700">{humanReviewThreshold}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.7"
                step="0.05"
                value={humanReviewThreshold}
                onChange={(e) => setHumanReviewThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Recommendations scoring below this threshold require administrator human verification.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">High Confidence Tier Threshold:</span>
                <span className="font-bold text-emerald-700">{highConfidenceThreshold}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.9"
                step="0.05"
                value={highConfidenceThreshold}
                onChange={(e) => setHighConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Scored pairs above this threshold receive the 'High Confidence' badge.</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800">Database Engine:</span>
              <p className="font-mono text-slate-500">SQLite (local session: ./research_collab.db) with PostgreSQL-ready SQLAlchemy ORM schema.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};
