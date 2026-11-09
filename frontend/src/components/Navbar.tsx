import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldCheck, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Derive current page title from pathname
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Research Office Overview';
      case '/researchers': return 'Researcher Directory';
      case '/publications': return 'Research Publications Repository';
      case '/graph': return 'Interactive Research Knowledge Graph';
      case '/clusters': return 'Research Theme Semantic Clustering';
      case '/collaborations': return 'Cross-School Collaboration Discovery';
      case '/evidence': return 'RAG Evidence Explorer & Mapping';
      case '/analytics': return 'Model Evaluation & Benchmarking';
      case '/data': return 'Institutional Data Management';
      case '/settings': return 'System Settings & Architecture';
      default: return 'Research Collaboration Assistant';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/researchers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>University Portal</span>
          <span>/</span>
          <span className="text-indigo-600 font-medium">Research Office</span>
        </div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search faculty, themes, publications..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Institutional Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Node Active</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Research Office Alerts</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                  2 Pending
                </span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); navigate('/collaborations'); }}>
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">Human Review Triggered</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        New faculty collaboration pairing requires verification due to sparse initial publication index.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); navigate('/clusters'); }}>
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">Semantic Clusters Updated</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        5 interdisciplinary theme clusters computed with Silhouette score 0.54.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium text-xs flex items-center justify-center ring-2 ring-indigo-100">
              {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{user.full_name}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
