import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastProvider, useToast } from './components/Toast';
import { OverviewPage } from './pages/OverviewPage';
import { ForecastExplorerPage } from './pages/ForecastExplorerPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { DecisionReplayPage } from './pages/DecisionReplayPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { triggerSync } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000,
      retry: 1,
    },
  },
});

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(new Date().toISOString());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Executive Overview';
      case '/forecast-explorer':
        return 'Forecast Explorer';
      case '/accuracy':
        return 'Forecast Accuracy & Performance';
      case '/decision-replay':
        return 'Historical Decision Replay';
      case '/data-explorer':
        return 'Data Explorer & Quality Audit';
      case '/methodology':
        return 'Methodology & Data Transparency';
      default:
        return 'WINDWISE Platform';
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await triggerSync();
      setLastRefresh(new Date().toISOString());
      // Invalidate all react-query queries to trigger refetch
      queryClient.invalidateQueries();
      showToast('Elexon BMRS stream synced successfully', 'success');
    } catch (err: any) {
      console.error('Refresh sync error:', err);
      showToast(err?.message || 'Data refresh failed. Using cached stream.', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-wind-bg text-wind-textPrimary flex overflow-x-hidden">
      {/* Mobile Drawer & Desktop Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-0 lg:pl-64 min-w-0 transition-all duration-300">
        {/* Topbar */}
        <Topbar
          pageTitle={getPageTitle(location.pathname)}
          lastRefresh={lastRefresh}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 mt-16 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <LayoutContent>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/forecast-explorer" element={<ForecastExplorerPage />} />
              <Route path="/accuracy" element={<AccuracyPage />} />
              <Route path="/decision-replay" element={<DecisionReplayPage />} />
              <Route path="/data-explorer" element={<DataExplorerPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
            </Routes>
          </LayoutContent>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
