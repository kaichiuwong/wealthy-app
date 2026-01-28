import React, { useEffect, useState, useCallback } from 'react';
import { ApiResponse, ChartDataPoint } from './types';
import { fetchWealthData } from './services/api';
import { parseDateKey, formatDateDisplay } from './utils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Export from './components/Export';
import Login from './components/Login';
import { TwoFactorSetup } from './components/TwoFactorSetup';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'export' | '2fa-setup'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Check JWT token validity on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('pa_token');
        const user = localStorage.getItem('pa_user');
        
        if (!token || !user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp > currentTime) {
          // Token is still valid
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          localStorage.removeItem('pa_token');
          localStorage.removeItem('pa_user');
          localStorage.removeItem('pa_email');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      
      // If API error is due to expired token, force logout
      if (err instanceof Error && err.message.includes('401')) {
        handleLogout();
      }
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
    localStorage.removeItem('pa_token');
    localStorage.removeItem('pa_user');
    localStorage.removeItem('pa_email');
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

  const handleNavigate = (view: 'dashboard' | 'transactions' | 'export' | '2fa-setup') => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handle2FAComplete = () => {
    setCurrentView('dashboard');
  };

  const handle2FACancel = () => {
    setCurrentView('dashboard');
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Right swipe from left edge opens menu
    if (isRightSwipe && touchStart < 50) {
      setIsMobileMenuOpen(true);
    }
    // Left swipe closes menu
    if (isLeftSwipe && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950"
      onTouchStart={isMobileMenuOpen ? undefined : onTouchStart}
      onTouchMove={isMobileMenuOpen ? undefined : onTouchMove}
      onTouchEnd={isMobileMenuOpen ? undefined : onTouchEnd}
    >
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
      {currentView === 'transactions' && <Transactions data={data} onRefresh={loadData} onModalChange={setIsMobileMenuOpen} />}
      {currentView === 'export' && <Export data={data} />}
      {currentView === '2fa-setup' && (
        <div className="p-4 sm:ml-64 sm:p-8">
          <TwoFactorSetup onComplete={handle2FAComplete} onCancel={handle2FACancel} />
        </div>
      )}
    </div>
  );
};

export default App;