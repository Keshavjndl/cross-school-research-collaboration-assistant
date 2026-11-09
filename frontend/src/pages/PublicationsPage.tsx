import React, { useEffect, useState } from 'react';
import {
  BookOpen, Search, Filter, Plus, Edit2, Trash2, ExternalLink,
  ChevronDown, ChevronUp, Calendar, Quote, Building2, Tag
} from 'lucide-react';
import { api } from '../services/api';
import { Publication, School, ResearchTheme } from '../types';
import { Modal } from '../components/Modal';

export const PublicationsPage: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [themes, setThemes] = useState<ResearchTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [expandedPubId, setExpandedPubId] = useState<number | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    abstract: '',
    authors: '',
    publication_year: 2024,
    school_id: 1,
    doi: '',
    citation_count: 0,
    keywords: '',
    themes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pubsData, schoolsData, themesData] = await Promise.all([
        api.getPublications({
          search: search || undefined,
          school_id: selectedSchool ? parseInt(selectedSchool) : undefined,
          year: selectedYear ? parseInt(selectedYear) : undefined,
        }),
        api.getSchools(),
        api.getThemes(),
      ]);
      setPublications(pubsData.publications);
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
  }, [search, selectedSchool, selectedYear]);

  const handleCreateOpen = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      title: '',
      abstract: '',
      authors: '',
      publication_year: 2024,
      school_id: schools[0]?.id || 1,
      doi: '',
      citation_count: 5,
      keywords: '',
      themes: '',
    });
    setIsModalOpen(true);
  };

  const handleEditOpen = (p: Publication) => {
    setModalMode('edit');
    setFormData({
      id: p.id,
      title: p.title,
      abstract: p.abstract,
      authors: p.authors.join(', '),
      publication_year: p.publication_year,
      school_id: p.school_id || 1,
      doi: p.doi || '',
      citation_count: p.citation_count,
      keywords: p.keywords.join(', '),
      themes: p.themes.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this publication record?')) return;
    try {
      await api.deletePublication(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        abstract: formData.abstract,
        authors: formData.authors.split(',').map((s) => s.trim()).filter(Boolean),
        publication_year: Number(formData.publication_year),
        school_id: Number(formData.school_id),
        doi: formData.doi || undefined,
        citation_count: Number(formData.citation_count),
        keywords: formData.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        themes: formData.themes.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (modalMode === 'create') {
        await api.createPublication(payload);
      } else {
        await api.updatePublication(formData.id, payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving publication');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Publications Repository</h2>
          <p className="text-xs text-slate-500">
            Search peer-reviewed literature, inspect grounded abstracts, and explore cross-indexed research themes.
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Publication Record
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, abstract keywords, authors, or DOI..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-full md:w-56 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        >
          <option value="">All Academic Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full md:w-36 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        >
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </select>
      </div>

      {/* Publications List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading publication repository...</div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No publications found</h3>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search term or year filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publications.map((p) => {
            const isExpanded = expandedPubId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded border border-indigo-100">
                        {p.school_code || p.school_name}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {p.publication_year}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Quote className="w-3 h-3 text-slate-400" /> {p.citation_count} citations
                      </span>
                      {p.doi && (
                        <a
                          href={`https://doi.org/${p.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-mono"
                        >
                          DOI: {p.doi} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                      {p.title}
                    </h3>

                    <div className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Authors: </span>
                      {p.authors.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditOpen(p)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Abstract Preview */}
                <div className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <p className={isExpanded ? '' : 'line-clamp-2'}>
                    {p.abstract}
                  </p>
                  <button
                    onClick={() => setExpandedPubId(isExpanded ? null : p.id)}
                    className="mt-1.5 text-indigo-600 font-semibold text-[11px] hover:underline flex items-center gap-0.5"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Read Full Abstract <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>

                {/* Tags */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {p.themes.map((th) => (
                    <span
                      key={th}
                      className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full font-medium"
                    >
                      {th}
                    </span>
                  ))}
                  {p.keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Publication' : 'Edit Publication Record'}
        subtitle="Ensure abstracts contain accurate domain methodology for semantic indexing"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Publication Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Deep Attention Convolutional Networks for Medical Image Diagnostics"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Abstract Text *</label>
            <textarea
              rows={4}
              required
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Enter complete publication abstract for semantic vectorization and RAG evidence grounding..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Authors (comma-separated) *</label>
              <input
                type="text"
                required
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="Dr. Aarav Mehta, Dr. Ananya Roy"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Academic School *</label>
              <select
                value={formData.school_id}
                onChange={(e) => setFormData({ ...formData, school_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Publication Year</label>
              <input
                type="number"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">DOI / Reference</label>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                placeholder="10.1016/j.rescollab.2024.101"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Citation Count</label>
              <input
                type="number"
                value={formData.citation_count}
                onChange={(e) => setFormData({ ...formData, citation_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Thematic Categories (comma-separated)</label>
            <input
              type="text"
              value={formData.themes}
              onChange={(e) => setFormData({ ...formData, themes: e.target.value })}
              placeholder="Artificial Intelligence, Healthcare Informatics"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="medical imaging, deep learning, radiograph"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
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
              {modalMode === 'create' ? 'Create Publication' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
