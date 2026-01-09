import React, { useEffect, useState } from 'react';
import { ApiResponse, ChartDataPoint } from './types';
import { fetchWealthData } from './services/api';
import { parseDateKey, formatDateDisplay } from './utils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions'>('dashboard');

  useEffect(() => {
    const loadData = async () => {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="animate-pulse text-sm text-slate-400">Loading Wealth Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-red-500">Unable to Connect</h2>
            <p className="text-slate-400">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-6 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
                Retry
            </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      {currentView === 'dashboard' ? (
        <Dashboard data={data} chartData={chartData} />
      ) : (
        <Transactions data={data} />
      )}
    </div>
  );
};

export default App;