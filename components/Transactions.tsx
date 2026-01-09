import React from 'react';
import { ApiResponse } from '../types';
import { parseDateKey, formatDateDisplay, formatCurrency } from '../utils';

interface TransactionsProps {
  data: ApiResponse;
}

const Transactions: React.FC<TransactionsProps> = ({ data }) => {
  const sortedMonths = Object.keys(data.balances).sort().reverse();

  const getAmount = (monthKey: string, item: string, currency?: string) => {
    const monthData = data.balances[monthKey];
    if (!monthData) return 0;

    const entry = monthData.balances.find(b => 
      b.item === item && 
      (!currency || b.currency === currency)
    );

    return entry ? entry.amount : 0;
  };

  const formatCrypto = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:ml-64 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transactions History</h1>
        <p className="text-slate-400">Monthly breakdown of asset balances across all portfolios.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-400">
            <thead className="bg-slate-950 text-xs uppercase text-slate-300">
              <tr>
                <th rowSpan={2} className="border-b border-slate-800 px-6 py-4 text-left font-semibold text-white sticky left-0 bg-slate-950 z-10">
                  Month
                </th>
                <th colSpan={2} className="border-b border-l border-slate-800 px-4 py-2 text-center text-emerald-500 font-bold bg-slate-950/50">
                  CASH
                </th>
                <th colSpan={3} className="border-b border-l border-slate-800 px-4 py-2 text-center text-indigo-500 font-bold bg-slate-950/50">
                  STOCK
                </th>
                <th colSpan={3} className="border-b border-l border-slate-800 px-4 py-2 text-center text-violet-500 font-bold bg-slate-950/50">
                  CRYPTO
                </th>
              </tr>
              <tr>
                {/* Cash Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 bg-slate-950/30">HKD</th>
                <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">AUD</th>
                
                {/* Stock Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 bg-slate-950/30">IBKR</th>
                <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">STAKE (AUD)</th>
                <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">STAKE (USD)</th>
                
                {/* Crypto Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 bg-slate-950/30">BTC</th>
                <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">XRP</th>
                <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">ETH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedMonths.map((monthKey) => {
                const date = parseDateKey(monthKey);
                return (
                  <tr key={monthKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 bg-slate-900 px-6 py-4 text-left font-medium text-white border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      {formatDateDisplay(date)}
                    </td>
                    
                    {/* CASH */}
                    <td className="px-4 py-4 text-slate-300 border-l border-slate-800/50">
                      {formatCurrency(getAmount(monthKey, 'BANK', 'HKD'), 'HKD')}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatCurrency(getAmount(monthKey, 'BANK', 'AUD'), 'AUD')}
                    </td>

                    {/* STOCK */}
                    <td className="px-4 py-4 text-slate-300 border-l border-slate-800/50">
                      {formatCurrency(getAmount(monthKey, 'IBKR'), 'AUD')}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatCurrency(getAmount(monthKey, 'STAKE', 'AUD'), 'AUD')}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatCurrency(getAmount(monthKey, 'STAKE', 'USD'), 'USD')}
                    </td>

                    {/* CRYPTO */}
                    <td className="px-4 py-4 font-mono text-slate-300 border-l border-slate-800/50">
                      {formatCrypto(getAmount(monthKey, 'BTC'))}
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-300">
                      {formatCrypto(getAmount(monthKey, 'XRP'))}
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-300">
                      {formatCrypto(getAmount(monthKey, 'ETH'))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;