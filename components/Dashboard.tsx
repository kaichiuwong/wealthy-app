import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Bitcoin, Landmark } from 'lucide-react';
import { ChartDataPoint, ApiResponse, MonthData } from '../types';
import { formatCurrency, formatPercentage } from '../utils';

interface DashboardProps {
  data: ApiResponse;
  chartData: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <p className="mb-2 font-semibold text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize text-slate-400">{entry.name}:</span>
            <span className="font-mono font-medium text-slate-200">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = {
  CASH: '#10b981', // Emerald 500
  STOCK: '#6366f1', // Indigo 500
  CRYPTO: '#8b5cf6', // Violet 500
};

const Dashboard: React.FC<DashboardProps> = ({ data, chartData }) => {
  // State for the selected month to show detail view, default to latest
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    Object.keys(data.balances).sort().pop() || ''
  );

  const currentMonthData: MonthData | undefined = data.balances[selectedMonthKey];

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (!chartData.length) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : latest;
    
    const change = latest.total - previous.total;
    const changePercent = (change / previous.total) * 100;

    return {
      total: latest.total,
      change,
      changePercent,
      breakdown: {
        cash: latest.cash,
        stock: latest.stock,
        crypto: latest.crypto
      }
    };
  }, [chartData]);

  // Pie Chart Data
  const pieData = useMemo(() => {
    if (!currentMonthData) return [];
    return [
      { name: 'Cash', value: currentMonthData.summary.breakdown.CASH.total, color: COLORS.CASH },
      { name: 'Stock', value: currentMonthData.summary.breakdown.STOCK.total, color: COLORS.STOCK },
      { name: 'Crypto', value: currentMonthData.summary.breakdown.CRYPTO.total, color: COLORS.CRYPTO },
    ].filter(d => d.value > 0);
  }, [currentMonthData]);

  if (!metrics || !currentMonthData) return <div className="text-white">No data available</div>;

  return (
    <div className="p-4 sm:ml-64 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Wealth Overview</h1>
          <p className="text-slate-400">Track your financial growth and asset allocation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-1">
            <select 
                className="bg-transparent px-4 py-2 text-sm text-white outline-none"
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
            >
                {Object.keys(data.balances).sort().reverse().map(date => (
                    <option key={date} value={date} className="bg-slate-900">{date}</option>
                ))}
            </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Net Worth */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg border border-slate-700/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Net Worth</p>
              <h3 className="mt-2 text-3xl font-bold text-white">{formatCurrency(metrics.total)}</h3>
            </div>
            <div className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${metrics.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {metrics.change >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {Math.abs(metrics.changePercent).toFixed(2)}%
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-700">
            <div className="h-1 bg-emerald-500" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Cash Stats */}
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Cash Balance</p>
              <h3 className="text-xl font-bold text-white">{formatCurrency(metrics.breakdown.cash)}</h3>
            </div>
          </div>
        </div>

        {/* Stock Stats */}
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Stocks & ETFs</p>
              <h3 className="text-xl font-bold text-white">{formatCurrency(metrics.breakdown.stock)}</h3>
            </div>
          </div>
        </div>

         {/* Crypto Stats */}
         <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500">
              <Bitcoin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Crypto Assets</p>
              <h3 className="text-xl font-bold text-white">{formatCurrency(metrics.breakdown.crypto)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Net Worth Trend */}
        <div className="col-span-1 rounded-2xl bg-slate-900 p-6 border border-slate-800 lg:col-span-2">
          <h3 className="mb-6 text-lg font-bold text-white">Net Worth Trend</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="displayDate" 
                    stroke="#94a3b8" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    tickFormatter={(value) => `$${value / 1000}k`} 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    name="Total Net Worth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Pie Chart */}
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <h3 className="mb-6 text-lg font-bold text-white">Asset Allocation ({selectedMonthKey})</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
             {pieData.map((item) => (
                 <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-300">{item.name}</span>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(item.value)}</p>
                        <p className="text-xs text-slate-500">
                            {formatPercentage((item.value / currentMonthData.summary.total) * 100)}
                        </p>
                     </div>
                 </div>
             ))}
          </div>
        </div>
      </div>

      {/* Stacked Bar Composition */}
      <div className="mb-8 rounded-2xl bg-slate-900 p-6 border border-slate-800">
        <h3 className="mb-6 text-lg font-bold text-white">Portfolio Composition</h3>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value / 1000}k`} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="cash" stackId="a" fill={COLORS.CASH} name="Cash" radius={[0, 0, 4, 4]} />
                <Bar dataKey="stock" stackId="a" fill={COLORS.STOCK} name="Stock" />
                <Bar dataKey="crypto" stackId="a" fill={COLORS.CRYPTO} name="Crypto" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Holdings List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800">
        <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white">Holdings Breakdown - {selectedMonthKey}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400">
                    <tr>
                        <th className="px-6 py-4">Asset</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Amount (Local)</th>
                        <th className="px-6 py-4 text-right">FX Rate</th>
                        <th className="px-6 py-4 text-right">Value (AUD)</th>
                    </tr>
                </thead>
                <tbody>
                    {currentMonthData.balances.filter(b => b.active).map((item) => (
                        <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-white">{item.item}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                                    ${item.trx_type === 'CASH' ? 'bg-emerald-500/10 text-emerald-500' : 
                                      item.trx_type === 'STOCK' ? 'bg-indigo-500/10 text-indigo-500' : 
                                      'bg-violet-500/10 text-violet-500'}`}>
                                    {item.trx_type}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {item.trx_type === 'CRYPTO' 
                                    ? item.amount 
                                    : new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}
                                <span className="ml-1 text-xs text-slate-500">{item.currency}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500">{item.fx_rate.toFixed(4)}</td>
                            <td className="px-6 py-4 text-right font-medium text-white">
                                {formatCurrency(item.amount * (item.currency === 'AUD' ? 1 : (item.trx_type === 'CASH' && item.currency !== 'AUD' ? 1/item.fx_rate : item.fx_rate)))}
                            </td>
                        </tr>
                    ))}
                    {/* Note: The logic for value calculation above is approximate based on sample data patterns (AUD base). 
                        Real calc depends on how backend stores FX. Using provided total logic for safety in summary. */}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;