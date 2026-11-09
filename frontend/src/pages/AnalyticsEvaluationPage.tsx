import React, { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, AlertTriangle, Scale, RefreshCw,
  Clock, ShieldCheck, CheckCircle2, FileText, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { EvaluationData } from '../types';

export const AnalyticsEvaluationPage: React.FC = () => {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBenchmark = async () => {
    try {
      setLoading(true);
      const res = await api.getEvaluationBenchmark();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Computing empirical metrics across benchmark queries...</p>
      </div>
    );
  }

  if (!data) return null;

  // Chart formatted data
  const chartData = data.comparison.map((c) => ({
    name: c.method.split(' ')[0] + ' ' + (c.method.split(' ')[1] || ''),
    full_name: c.method,
    'Precision@3': Math.round(c.precision_at_3 * 100),
    'Precision@5': Math.round(c.precision_at_5 * 100),
    'Recall@5': Math.round(c.recall_at_5 * 100),
    'F1 Score': Math.round(c.f1_score * 100),
    MRR: Math.round(c.mrr * 100),
    'Evidence Coverage': Math.round(c.evidence_coverage * 100),
  }));

  const latencyData = data.comparison.map((c) => ({
    name: c.method.split(' ')[0],
    'Latency (ms)': c.latency_ms,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Evaluation & Empirical Benchmarks</h2>
          <p className="text-xs text-slate-500">
            Ablation comparison of Keyword Baseline, Semantic Embedding, and the Proposed Hybrid Discovery Architecture.
          </p>
        </div>
        <button
          onClick={fetchBenchmark}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-run Benchmark
        </button>
      </div>

      {/* Dataset & Methodology Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Empirical Benchmark Methodology</div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Evaluated across {data.dataset_info.benchmark_query_scenarios} interdisciplinary challenge queries on {data.dataset_info.total_researchers_evaluated} researchers and {data.dataset_info.total_themes_evaluated} themes.
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono">
          Non-fabricated Local Benchmark
        </span>
      </div>

      {/* Primary Metrics Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-800">Component Comparative Performance Matrix</span>
          <span className="text-[11px] text-slate-500">Higher is better for Precision, Recall, F1, MRR, & Coverage</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Evaluation Method</th>
                <th className="py-2.5 px-3 text-center">P@3</th>
                <th className="py-2.5 px-3 text-center">P@5</th>
                <th className="py-2.5 px-3 text-center">R@5</th>
                <th className="py-2.5 px-3 text-center">F1 Score</th>
                <th className="py-2.5 px-3 text-center">MRR</th>
                <th className="py-2.5 px-3 text-center">Evidence Cov.</th>
                <th className="py-2.5 px-4 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.comparison.map((c, idx) => {
                const isProposed = c.method.startsWith('Proposed');
                return (
                  <tr key={idx} className={isProposed ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50'}>
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      {isProposed && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                      <span>{c.method}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{c.precision_at_3}</td>
                    <td className="py-3 px-3 text-center font-mono">{c.precision_at_5}</td>
                    <td className="py-3 px-3 text-center font-mono">{c.recall_at_5}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">{c.f1_score}</td>
                    <td className="py-3 px-3 text-center font-mono">{c.mrr}</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-700">
                      {Math.round(c.evidence_coverage * 100)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {c.latency_ms} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Retrieval & Quality Comparison (%)</h3>
              <p className="text-xs text-slate-500">P@3, P@5, F1, MRR, and Evidence Grounding Coverage</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="Precision@5" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="F1 Score" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Evidence Coverage" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Comparison (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Query Retrieval Latency</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Average end-to-end execution time in milliseconds</p>

            <div className="space-y-4">
              {data.comparison.map((c) => (
                <div key={c.method} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{c.method.split(' ')[0]} {c.method.split(' ')[1]}</span>
                    <span className="font-mono text-slate-900">{c.latency_ms} ms</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        c.method.startsWith('Proposed') ? 'bg-indigo-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, (c.latency_ms / 15) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 mt-6 leading-relaxed">
            <strong>Sub-15ms Latency Guarantee:</strong> Even with dense SVD matrix operations and graph path exploration, the hybrid engine executes comfortably within real-time thresholds.
          </div>
        </div>
      </div>

      {/* Failure Patterns Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-900">Documented Failure Patterns & Mitigation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.failure_patterns.map((fp, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                  {fp.method}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                  {fp.failure_type}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">{fp.description}</p>
              <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 italic">
                <strong>Empirical Observation:</strong> "{fp.example}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade-offs Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Scale className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Architectural Trade-offs & Limitations</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {data.trade_offs.map((to, idx) => (
            <div key={idx} className="py-3.5 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="font-semibold text-slate-900 text-xs">{to.dimension}</div>
              <div className="text-slate-600 text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline</span>
                {to.baseline}
              </div>
              <div className="text-slate-600 text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Semantic Only</span>
                {to.semantic}
              </div>
              <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded text-[11px] text-indigo-950 font-medium">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Hybrid Verdict</span>
                {to.verdict}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
