import React, { useEffect, useState, useCallback } from 'react';
import { ApiResponse, ChartDataPoint } from './types';
import { fetchWealthData } from './services/api';
import { parseDateKey, formatDateDisplay } from './utils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Export from './components/Export';
import Login from './components/Login';
import { Loader2, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'export'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const apiResponse = await fetchWealthData();
      setData(apiResponse);

      // Transform data for charts
      const transformedData: ChartDataPoint[] = Object.entries(apiResponse.balances)
        .map(([key, value]) => {
          const date = parseDateKey(key);
          return {
            month: key,
            displayDate: formatDateDisplay(date),
            rawDate: date,
            total: value.summary.total,
            cash: value.summary.breakdown.CASH.total,
            stock: value.summary.breakdown.STOCK.total,
            crypto: value.summary.breakdown.CRYPTO.total,
          };
        })
        .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

      setChartData(transformedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Only load data once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setData(null);
  };

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Once authenticated, show Loading or App
  if (loading && !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="animate-pulse text-sm text-slate-400">Loading Wealth Data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-red-500">Unable to Connect</h2>
            <p className="text-slate-400">{error}</p>
            <button 
                onClick={() => loadData()}
                className="mt-6 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
                Retry
            </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleNavigate = (view: 'dashboard' | 'transactions' | 'export') => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-800 p-2 text-white sm:hidden"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      {currentView === 'dashboard' && <Dashboard data={data} chartData={chartData} />}
      {currentView === 'transactions' && <Transactions data={data} onRefresh={loadData} />}
      {currentView === 'export' && <Export data={data} />}
    </div>
  );
};

export default App;