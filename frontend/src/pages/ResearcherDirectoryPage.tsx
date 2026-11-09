import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, Plus, Edit2, Trash2, ExternalLink,
  BookOpen, Sparkles, Building2, Award, CheckCircle2, X
} from 'lucide-react';
import { api } from '../services/api';
import { Researcher, School, ResearchTheme } from '../types';
import { Modal } from '../components/Modal';

export const ResearcherDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [themes, setThemes] = useState<ResearchTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'h_index' | 'total_citations'>('h_index');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer & Modal States
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    email: '',
    school_id: 1,
    designation: 'Assistant Professor',
    bio: '',
    research_interests: '',
    skills: '',
    h_index: 5,
    total_citations: 100,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resData, schoolsData, themesData] = await Promise.all([
        api.getResearchers({
          search: search || undefined,
          school_id: selectedSchool ? parseInt(selectedSchool) : undefined,
          theme: selectedTheme || undefined,
        }),
        api.getSchools(),
        api.getThemes(),
      ]);
      setResearchers(resData.researchers);
      setSchools(schoolsData);
      setThemes(themesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedSchool, selectedTheme]);

  const sortedResearchers = [...researchers].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'h_index') return b.h_index - a.h_index;
    if (sortBy === 'total_citations') return b.total_citations - a.total_citations;
    return 0;
  });

  const handleOpenProfile = async (r: Researcher) => {
    try {
      const full = await api.getResearcher(r.id);
      setSelectedResearcher(full);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOpen = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      name: '',
      email: '',
      school_id: schools[0]?.id || 1,
      designation: 'Assistant Professor',
      bio: '',
      research_interests: '',
      skills: '',
      h_index: 4,
      total_citations: 80,
    });
    setIsModalOpen(true);
  };

  const handleEditOpen = (r: Researcher, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setFormData({
      id: r.id,
      name: r.name,
      email: r.email,
      school_id: r.school_id,
      designation: r.designation,
      bio: r.bio || '',
      research_interests: r.research_interests.join(', '),
      skills: r.skills.join(', '),
      h_index: r.h_index,
      total_citations: r.total_citations,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this researcher profile?')) return;
    try {
      await api.deleteResearcher(id);
      loadData();
      if (selectedResearcher?.id === id) setIsDrawerOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        school_id: Number(formData.school_id),
        designation: formData.designation,
        bio: formData.bio,
        research_interests: formData.research_interests.split(',').map((s) => s.trim()).filter(Boolean),
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        h_index: Number(formData.h_index),
        total_citations: Number(formData.total_citations),
      };

      if (modalMode === 'create') {
        await api.createResearcher(payload);
      } else {
        await api.updateResearcher(formData.id, payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving researcher');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Faculty Directory</h2>
          <p className="text-xs text-slate-500">
            Search, filter, and inspect researcher profiles, published works, and cross-school interests.
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Profile
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, expertise, or keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
        </div>

        {/* School Dropdown */}
        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-full md:w-52 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        >
          <option value="">All Academic Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Theme Dropdown */}
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="w-full md:w-48 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        >
          <option value="">All Research Themes</option>
          {themes.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e: any) => setSortBy(e.target.value)}
          className="w-full md:w-36 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        >
          <option value="h_index">Sort: h-index</option>
          <option value="total_citations">Sort: Citations</option>
          <option value="name">Sort: Name (A-Z)</option>
        </select>

        {/* View Toggle */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Roster Grid / Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading faculty profiles...</div>
      ) : sortedResearchers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No researchers found</h3>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search query or reset school filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedResearchers.map((r) => (
            <div
              key={r.id}
              onClick={() => handleOpenProfile(r)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm flex-shrink-0">
                      {r.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {r.name}
                      </h4>
                      <p className="text-xs text-slate-500">{r.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditOpen(r, e)}
                      className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(r.id, e)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                    {r.school_name}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                  {r.bio || 'Faculty profile currently undergoing institutional ontology indexing.'}
                </p>

                {/* Research Interests Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {r.research_interests.slice(0, 3).map((theme) => (
                    <span
                      key={theme}
                      className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
                    >
                      {theme}
                    </span>
                  ))}
                  {r.research_interests.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{r.research_interests.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px]">
                    <strong className="text-slate-800 font-semibold">{r.h_index}</strong> h-index
                  </span>
                  <span>&bull;</span>
                  <span className="font-mono text-[11px]">
                    <strong className="text-slate-800 font-semibold">{r.total_citations}</strong> citations
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600 font-medium group-hover:underline flex items-center gap-1">
                  Profile <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Researcher</th>
                <th className="py-3 px-4">School & Department</th>
                <th className="py-3 px-4">Core Research Interests</th>
                <th className="py-3 px-4">Metrics</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedResearchers.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => handleOpenProfile(r)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{r.school_name}</div>
                    <div className="text-[11px] text-slate-500">{r.designation}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {r.research_interests.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    h-index: <span className="font-bold text-slate-900">{r.h_index}</span> &bull; {r.total_citations} cites
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleEditOpen(r, e)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(r.id, e)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Profile Drawer */}
      {isDrawerOpen && selectedResearcher && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                  {selectedResearcher.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-900">{selectedResearcher.name}</h3>
                  <p className="text-xs text-slate-500">{selectedResearcher.designation}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate(`/collaborations?target_id=${selectedResearcher.id}`);
                  }}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Discover Collaborators
                </button>
              </div>

              {/* Affiliation & Stats */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">School</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedResearcher.school_name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">h-index</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedResearcher.h_index}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Citations</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedResearcher.total_citations}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-1 text-xs">Academic Biography</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {selectedResearcher.bio || 'Biography not specified.'}
                </p>
              </div>

              {/* Research Interests */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 text-xs">Research Themes & Interests</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResearcher.research_interests.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Methodological Skills */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 text-xs">Skills & Technical Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResearcher.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linked Publications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 text-xs">
                    Linked Publications ({selectedResearcher.publications?.length || 0})
                  </h4>
                </div>
                <div className="space-y-3">
                  {selectedResearcher.publications && selectedResearcher.publications.length > 0 ? (
                    selectedResearcher.publications.map((p) => (
                      <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                        <div className="font-semibold text-slate-900 text-xs leading-snug">{p.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Year: {p.publication_year} &bull; Citations: {p.citation_count || (p as any).citations}
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-3 leading-relaxed">
                          {p.abstract}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      No publications currently indexed for this researcher.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Faculty Member' : 'Edit Faculty Member'}
        subtitle="Maintain university researcher metadata for interdisciplinary matching"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Ramesh Kumar"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh.kumar@university.edu"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Academic School *</label>
              <select
                value={formData.school_id}
                onChange={(e) => setFormData({ ...formData, school_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Associate Professor"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Research Interests (comma-separated) *</label>
            <input
              type="text"
              required
              value={formData.research_interests}
              onChange={(e) => setFormData({ ...formData, research_interests: e.target.value })}
              placeholder="Artificial Intelligence, Computer Vision, Healthcare Informatics"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Technical Skills & Methods (comma-separated)</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="PyTorch, CNN, MRI Segmentation, CUDA"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Academic Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Summarize research specialization and current laboratory focus..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">h-index</label>
              <input
                type="number"
                value={formData.h_index}
                onChange={(e) => setFormData({ ...formData, h_index: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Total Citations</label>
              <input
                type="number"
                value={formData.total_citations}
                onChange={(e) => setFormData({ ...formData, total_citations: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
            >
              {modalMode === 'create' ? 'Create Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
