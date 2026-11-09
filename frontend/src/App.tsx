import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResearcherDirectoryPage } from './pages/ResearcherDirectoryPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { ThemeClusteringPage } from './pages/ThemeClusteringPage';
import { CollaborationDiscoveryPage } from './pages/CollaborationDiscoveryPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { AnalyticsEvaluationPage } from './pages/AnalyticsEvaluationPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SettingsPage } from './pages/SettingsPage';

function AppLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
      </div>
    );
  }

  // If unauthenticated and on login/signup, render login page
  if (!user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <LoginPage />;
  }

  // If unauthenticated and trying to access protected pages, redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar />

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/researchers" element={<ResearcherDirectoryPage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/graph" element={<KnowledgeGraphPage />} />
            <Route path="/clusters" element={<ThemeClusteringPage />} />
            <Route path="/collaborations" element={<CollaborationDiscoveryPage />} />
            <Route path="/evidence" element={<EvidenceExplorerPage />} />
            <Route path="/analytics" element={<AnalyticsEvaluationPage />} />
            <Route path="/data" element={<DataManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
