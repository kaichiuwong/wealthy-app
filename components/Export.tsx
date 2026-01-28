import React, { useState } from 'react';
import { ApiResponse, BalanceItem } from '../types';
import { Download, FileDown, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { parseDateKey, formatDateDisplay } from '../utils';

interface ExportProps {
  data: ApiResponse;
}

const Export: React.FC<ExportProps> = ({ data }) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);

  const sortedMonths = Object.keys(data.balances).sort().reverse();

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths(sortedMonths);
  };

  const clearSelection = () => {
    setSelectedMonths([]);
  };

  const convertToCSV = (records: BalanceItem[]): string => {
    const headers = [
      'Date',
      'Item',
      'Amount',
      'Currency',
      'Base Currency',
      'FX Rate',
      'Base Amount',
      'Type',
      'Active'
    ];

    const rows = records.map(record => [
      record.inputdate,
      record.item,
      record.amount.toString(),
      record.currency,
      record.base_currency,
      record.fx_rate.toString(),
      (record.amount * record.fx_rate).toFixed(2),
      record.trx_type,
      record.active ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month to export');
      return;
    }

    const records: BalanceItem[] = [];
    
    selectedMonths.forEach(month => {
      const monthData = data.balances[month];
      const balances = includeInactive 
        ? monthData.balances 
        : monthData.balances.filter(b => b.active);
      
      records.push(...balances);
    });

    const csvContent = convertToCSV(records);
    const filename = selectedMonths.length === 1 
      ? `wealth-data-${selectedMonths[0]}.csv`
      : `wealth-data-${selectedMonths.length}-months.csv`;
    
    downloadCSV(csvContent, filename);
  };

  const handleExportAll = () => {
    const records: BalanceItem[] = [];
    
    Object.values(data.balances).forEach(monthData => {
      const balances = includeInactive 
        ? monthData.balances 
        : monthData.balances.filter(b => b.active);
      
      records.push(...balances);
    });

    const csvContent = convertToCSV(records);
    const filename = `wealth-data-all-${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(csvContent, filename);
  };

  const handleExportSummary = () => {
    const headers = [
      'Month',
      'Total',
      'Cash Total',
      'Cash %',
      'Stock Total',
      'Stock %',
      'Crypto Total',
      'Crypto %'
    ];

    const rows = Object.entries(data.balances)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, monthData]) => [
        month,
        monthData.summary.total.toFixed(2),
        monthData.summary.breakdown.CASH.total.toFixed(2),
        monthData.summary.breakdown.CASH.percentage.toFixed(2),
        monthData.summary.breakdown.STOCK.total.toFixed(2),
        monthData.summary.breakdown.STOCK.percentage.toFixed(2),
        monthData.summary.breakdown.CRYPTO.total.toFixed(2),
        monthData.summary.breakdown.CRYPTO.percentage.toFixed(2)
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const filename = `wealth-summary-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const getTotalRecords = (month: string): number => {
    const monthData = data.balances[month];
    return includeInactive 
      ? monthData.balances.length 
      : monthData.balances.filter(b => b.active).length;
  };

  return (
    <div className="ml-0 p-8 sm:ml-64">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Export Data</h1>
          <p className="text-slate-400">Download your wealth data in CSV format</p>
        </div>

        {/* Quick Export Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6 text-left transition hover:bg-emerald-500/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
              <FileDown className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Export All Records</h3>
              <p className="text-sm text-slate-400">Download complete dataset</p>
            </div>
          </button>

          <button
            onClick={handleExportSummary}
            className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6 text-left transition hover:bg-blue-500/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Export Summary</h3>
              <p className="text-sm text-slate-400">Monthly totals & breakdown</p>
            </div>
          </button>

          <button
            onClick={handleExportSelected}
            disabled={selectedMonths.length === 0}
            className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/10 p-6 text-left transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
              <Download className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Export Selected</h3>
              <p className="text-sm text-slate-400">
                {selectedMonths.length > 0 
                  ? `${selectedMonths.length} month(s) selected`
                  : 'Select months below'}
              </p>
            </div>
          </button>
        </div>

        {/* Options */}
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="includeInactive" className="text-sm text-slate-300">
              Include inactive records
            </label>
          </div>
        </div>

        {/* Month Selection */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-white">Select Months</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAllMonths}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            <div className="grid gap-2">
              {sortedMonths.map(month => {
                const monthData = data.balances[month];
                const date = parseDateKey(month);
                const displayDate = formatDateDisplay(date);
                const isSelected = selectedMonths.includes(month);
                const recordCount = getTotalRecords(month);

                return (
                  <button
                    key={month}
                    onClick={() => toggleMonth(month)}
                    className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-emerald-500/20' : 'bg-slate-700'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          isSelected ? 'text-emerald-500' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{displayDate}</div>
                        <div className="text-sm text-slate-400">
                          {recordCount} record{recordCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Total</div>
                        <div className="font-semibold text-emerald-500">
                          ${monthData.summary.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded border ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-600'
                      }`}>
                        {isSelected && (
                          <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Info */}
        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-2 font-semibold text-white">CSV Format Information</h3>
          <p className="text-sm text-slate-400">
            Exported CSV files include: Date, Item, Amount, Currency, Base Currency, FX Rate, Base Amount, Type, and Active status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Export;
