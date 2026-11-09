import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Share2,
  Boxes,
  Sparkles,
  FileCheck2,
  BarChart3,
  Database,
  Settings,
  GraduationCap,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Researcher Directory', href: '/researchers', icon: Users },
  { name: 'Research Publications', href: '/publications', icon: BookOpen },
  { name: 'Research Knowledge Graph', href: '/graph', icon: Share2 },
  { name: 'Research Theme Clustering', href: '/clusters', icon: Boxes },
  { name: 'Collaboration Discovery', href: '/collaborations', icon: Sparkles },
  { name: 'Evidence Explorer', href: '/evidence', icon: FileCheck2 },
  { name: 'Analytics & Evaluation', href: '/analytics', icon: BarChart3 },
  { name: 'Data Management', href: '/data', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-white tracking-tight leading-tight">
            Research Assistant
          </span>
          <span className="text-[10px] text-indigo-400 font-medium tracking-wider">
            Institutional AI Platform
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          University Navigation
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Authenticated User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white font-medium text-xs flex items-center justify-center ring-1 ring-indigo-400 flex-shrink-0">
                {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white text-[11px] truncate leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">
                  {user.role}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium text-slate-300">System Online</span>
          </div>
        )}
      </div>
    </aside>
  );
};
