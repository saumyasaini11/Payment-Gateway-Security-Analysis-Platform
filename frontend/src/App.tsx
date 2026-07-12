import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import History from './pages/History';
import System from './pages/System';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen w-screen overflow-hidden bg-navy-50/10">
          {/* Sidebar */}
          <Sidebar />

          {/* Main App Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/results" element={<Results />} />
              <Route path="/history" element={<History />} />
              <Route path="/system" element={<System />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
