import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Layout
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';

import Dashboard from './pages/Dashboard';
import MapIntelligence from './pages/MapIntelligence';
import EnforcementWorklist from './pages/EnforcementWorklist';
import HotspotDetails from './pages/HotspotDetails';
import DigitalTwin from './pages/DigitalTwin';
import PatrolRoutes from './pages/PatrolRoutes';
import RiskBrief from './pages/RiskBrief';

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] dark:bg-[#020617] text-[#111827] dark:text-[#F8FAFC] overflow-hidden font-sans">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC] dark:bg-[#020617]">
        <Outlet />
      </main>
    </div>
  );
};

const AppContent = () => {
  const { loading, error } = useData();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] text-[#111827] dark:text-[#F8FAFC] flex-col">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-[#0F4C81] dark:border-blue-500 mb-4"></div>
        <div className="text-xl font-semibold">Initializing LittleCam Core...</div>
        <div className="text-[#64748B] dark:text-gray-400 mt-2">Loading historical JSON data</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] text-[#DC2626] dark:text-red-400">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<MapIntelligence />} />
        <Route path="/worklist" element={<EnforcementWorklist />} />
        <Route path="/hotspots" element={<HotspotDetails />} />
        <Route path="/twin" element={<DigitalTwin />} />
        <Route path="/patrol" element={<PatrolRoutes />} />
        <Route path="/reports" element={<RiskBrief />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DataProvider>
          <Router>
            <AppContent />
          </Router>
        </DataProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

