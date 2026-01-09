import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ApiResponse } from '../types';
import { parseDateKey, formatDateDisplay } from '../utils';

interface TransactionsProps {
  data: ApiResponse;
}

const Transactions: React.FC<TransactionsProps> = ({ data }) => {
  const [showCashDetails, setShowCashDetails] = useState(false);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  
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

  const formatFiat = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCrypto = (amount: number, coin: string) => {
    const decimals = (coin === 'BTC' || coin === 'ETH') ? 8 : 4;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="p-4 sm:ml-64 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transactions History</h1>
        <p className="text-slate-400">Monthly breakdown of asset balances and portfolio performance.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-400 whitespace-nowrap">
            <thead className="bg-slate-950 text-xs uppercase text-slate-300">
              <tr>
                <th rowSpan={2} className="border-b border-slate-800 px-6 py-4 text-left font-semibold text-white sticky left-0 bg-slate-950 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Month
                </th>
                <th rowSpan={2} className="border-b border-l border-slate-800 px-4 py-4 text-emerald-400 font-bold bg-slate-950">
                  Net Worth
                </th>
                {/* CASH Header - Clickable */}
                <th 
                  colSpan={showCashDetails ? 4 : 2} 
                  onClick={() => setShowCashDetails(!showCashDetails)}
                  className="border-b border-l border-slate-800 px-4 py-2 text-center text-emerald-500 font-bold bg-slate-950/50 cursor-pointer hover:bg-slate-900/80 transition-colors select-none group"
                >
                   <div className="flex items-center justify-center gap-1">
                    CASH
                    {showCashDetails ? (
                      <ChevronDown size={14} className="opacity-50 group-hover:opacity-100" />
                    ) : (
                      <ChevronRight size={14} className="opacity-50 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                {/* STOCK Header - Clickable */}
                <th 
                  colSpan={showStockDetails ? 5 : 2} 
                  onClick={() => setShowStockDetails(!showStockDetails)}
                  className="border-b border-l border-slate-800 px-4 py-2 text-center text-indigo-500 font-bold bg-slate-950/50 cursor-pointer hover:bg-slate-900/80 transition-colors select-none group"
                >
                  <div className="flex items-center justify-center gap-1">
                    STOCK
                    {showStockDetails ? (
                      <ChevronDown size={14} className="opacity-50 group-hover:opacity-100" />
                    ) : (
                      <ChevronRight size={14} className="opacity-50 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                {/* CRYPTO Header - Clickable */}
                <th 
                  colSpan={showCryptoDetails ? 5 : 2}
                  onClick={() => setShowCryptoDetails(!showCryptoDetails)}
                  className="border-b border-l border-slate-800 px-4 py-2 text-center text-violet-500 font-bold bg-slate-950/50 cursor-pointer hover:bg-slate-900/80 transition-colors select-none group"
                >
                  <div className="flex items-center justify-center gap-1">
                    CRYPTO
                    {showCryptoDetails ? (
                      <ChevronDown size={14} className="opacity-50 group-hover:opacity-100" />
                    ) : (
                      <ChevronRight size={14} className="opacity-50 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
              </tr>
              <tr>
                {/* CASH Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 text-slate-200 font-semibold bg-slate-950/40">Total</th>
                <th className="border-b border-slate-800 px-4 py-3 text-slate-400 bg-slate-950/40">%</th>
                {showCashDetails && (
                  <>
                    <th className="border-b border-l border-slate-800/50 px-4 py-3 bg-slate-950/30">HKD</th>
                    <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">AUD</th>
                  </>
                )}
                
                {/* STOCK Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 text-slate-200 font-semibold bg-slate-950/40">Total</th>
                <th className="border-b border-slate-800 px-4 py-3 text-slate-400 bg-slate-950/40">%</th>
                {showStockDetails && (
                  <>
                    <th className="border-b border-l border-slate-800/50 px-4 py-3 bg-slate-950/30">IBKR</th>
                    <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">STAKE (AUD)</th>
                    <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">STAKE (USD)</th>
                  </>
                )}
                
                {/* CRYPTO Subcolumns */}
                <th className="border-b border-l border-slate-800 px-4 py-3 text-slate-200 font-semibold bg-slate-950/40">Total</th>
                <th className="border-b border-slate-800 px-4 py-3 text-slate-400 bg-slate-950/40">%</th>
                {showCryptoDetails && (
                  <>
                    <th className="border-b border-l border-slate-800/50 px-4 py-3 bg-slate-950/30">BTC</th>
                    <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">XRP</th>
                    <th className="border-b border-slate-800 px-4 py-3 bg-slate-950/30">ETH</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedMonths.map((monthKey) => {
                const date = parseDateKey(monthKey);
                const summary = data.balances[monthKey].summary;
                const cash = summary.breakdown.CASH;
                const stock = summary.breakdown.STOCK;
                const crypto = summary.breakdown.CRYPTO;

                return (
                  <tr key={monthKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 bg-slate-900 px-6 py-4 text-left font-medium text-white border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      {formatDateDisplay(date)}
                    </td>
                    
                    {/* Net Worth */}
                    <td className="px-4 py-4 text-emerald-400 font-bold border-l border-slate-800 bg-slate-900/20">
                      {formatFiat(summary.total, 'AUD')}
                    </td>

                    {/* CASH Group */}
                    <td className="px-4 py-4 font-semibold text-slate-200 border-l border-slate-800 bg-slate-900/10">
                      {formatFiat(cash.total, 'AUD')}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 bg-slate-900/10">
                      {formatPercent(cash.percentage)}
                    </td>
                    {showCashDetails && (
                      <>
                        <td className="px-4 py-4 text-slate-300 border-l border-slate-800/50">
                          {formatFiat(getAmount(monthKey, 'BANK', 'HKD'), 'HKD')}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatFiat(getAmount(monthKey, 'BANK', 'AUD'), 'AUD')}
                        </td>
                      </>
                    )}

                    {/* STOCK Group */}
                    <td className="px-4 py-4 font-semibold text-slate-200 border-l border-slate-800 bg-slate-900/10">
                      {formatFiat(stock.total, 'AUD')}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 bg-slate-900/10">
                      {formatPercent(stock.percentage)}
                    </td>
                    {showStockDetails && (
                      <>
                        <td className="px-4 py-4 text-slate-300 border-l border-slate-800/50">
                          {formatFiat(getAmount(monthKey, 'IBKR'), 'AUD')}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatFiat(getAmount(monthKey, 'STAKE', 'AUD'), 'AUD')}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatFiat(getAmount(monthKey, 'STAKE', 'USD'), 'USD')}
                        </td>
                      </>
                    )}

                    {/* CRYPTO Group */}
                    <td className="px-4 py-4 font-semibold text-slate-200 border-l border-slate-800 bg-slate-900/10">
                      {formatFiat(crypto.total, 'AUD')}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 bg-slate-900/10">
                      {formatPercent(crypto.percentage)}
                    </td>
                    {showCryptoDetails && (
                      <>
                        <td className="px-4 py-4 font-mono text-slate-300 border-l border-slate-800/50">
                          {formatCrypto(getAmount(monthKey, 'BTC'), 'BTC')}
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-300">
                          {formatCrypto(getAmount(monthKey, 'XRP'), 'XRP')}
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-300">
                          {formatCrypto(getAmount(monthKey, 'ETH'), 'ETH')}
                        </td>
                      </>
                    )}
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