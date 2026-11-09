import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  BookOpen,
  Boxes,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Aggregating institutional research intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl m-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-red-900">Failed to load dashboard metrics</h3>
        <p className="text-xs text-red-700 mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const { metrics, activity_chart, school_distribution, theme_distribution, top_collaborations, recently_added_researchers } = data;

  const kpis = [
    { title: 'Total Faculty & Researchers', value: metrics.total_researchers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/researchers' },
    { title: 'Academic Schools', value: metrics.total_schools, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/graph' },
    { title: 'Indexed Publications', value: metrics.total_publications, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/publications' },
    { title: 'Active Research Themes', value: metrics.total_themes, icon: Boxes, color: 'text-purple-600', bg: 'bg-purple-50', link: '/clusters' },
    { title: 'Collaborations Discovered', value: metrics.total_collaborations, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', link: '/collaborations' },
    { title: 'Pending Human Reviews', value: metrics.pending_reviews, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/collaborations' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold uppercase tracking-wider">
              Research Intelligence Engine Online
            </span>
            <span className="text-xs text-slate-400">Institutional Knowledge Network</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Cross-School Research Collaboration Discovery
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            AI-powered semantic mapping and evidence grounding assistant connecting researchers across Computer Science,
            Bioengineering, Pharmaceutical Sciences, Agriculture, and Mechanical Engineering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/collaborations')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Discover Collaborations
          </button>
          <button
            onClick={() => navigate('/graph')}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            Explore Graph
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              onClick={() => navigate(kpi.link)}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">{kpi.title}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Institutional Publication Trajectory</h3>
              <p className="text-xs text-slate-500">Peer-reviewed publications across academic years</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full border border-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Growth +38%
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activity_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="publications" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* School Faculty Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Faculty Distribution Across Schools</h3>
              <p className="text-xs text-slate-500">Total faculty profiles currently mapped in database</p>
            </div>
            <button onClick={() => navigate('/researchers')} className="text-xs text-indigo-600 hover:underline font-medium">
              View All
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={school_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" stroke="#94a3b8" fontSize={10} interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="researchers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Researchers" />
                <Bar dataKey="publications" fill="#10b981" radius={[4, 4, 0, 0]} name="Publications" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Bottom: Top Recommendations & Recent Faculty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Recommended Collaborations (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top Recommended Collaborations</h3>
              <p className="text-xs text-slate-500">High-affinity cross-school researcher pairs identified by AI engine</p>
            </div>
            <button
              onClick={() => navigate('/collaborations')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Launch Discovery Engine <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {top_collaborations && top_collaborations.length > 0 ? (
              top_collaborations.map((opp: any) => (
                <div
                  key={opp.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-indigo-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {Math.round(opp.compatibility_score * 100)}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900">{opp.researcher_1_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                          {opp.researcher_1_school.split(' ')[2] || 'School 1'}
                        </span>
                        <span className="text-slate-400 text-xs">&harr;</span>
                        <span className="font-semibold text-xs text-slate-900">{opp.researcher_2_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">
                          {opp.researcher_2_school.split(' ')[2] || 'School 2'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {opp.shared_themes.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      opp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      opp.status === 'Human Review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {opp.status}
                    </span>
                    <button
                      onClick={() => navigate('/evidence')}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 text-xs rounded-lg font-medium shadow-sm transition-all"
                    >
                      Evidence
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No collaboration records generated yet. Launch the Discovery engine to compute matches.
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Faculty Profiles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Faculty Roster</h3>
              <p className="text-xs text-slate-500">Recently updated profiles</p>
            </div>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recently_added_researchers.map((r: any) => (
              <div
                key={r.id}
                onClick={() => navigate(`/researchers`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-[11px] text-slate-500">{r.designation}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">{r.school_name}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                    h-index: {r.h_index}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/researchers')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all"
          >
            View All Researchers
          </button>
        </div>
      </div>
    </div>
  );
};
