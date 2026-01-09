import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Loader2, X, History } from 'lucide-react';
import { ApiResponse } from '../types';
import { parseDateKey, formatDateDisplay } from '../utils';
import { saveBalanceItem, BalancePayload } from '../services/api';

interface TransactionsProps {
  data: ApiResponse;
  onRefresh?: () => void;
}

interface FormState {
  date: string;
  bankAud: string;
  bankHkd: string;
  ibkrAud: string;
  btc: string;
  xrp: string;
  eth: string;
}

const Transactions: React.FC<TransactionsProps> = ({ data, onRefresh }) => {
  const [showCashDetails, setShowCashDetails] = useState(false);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    date: new Date().toISOString().split('T')[0],
    bankAud: '',
    bankHkd: '',
    ibkrAud: '',
    btc: '',
    xrp: '',
    eth: ''
  });

  // Rates State
  const [currentRates, setCurrentRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(false);

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

  // --- Transaction Logic ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAutoFill = (field: 'btc' | 'eth' | 'xrp', item: 'BTC' | 'ETH' | 'XRP') => {
    for (const month of sortedMonths) {
      const monthData = data.balances[month];
      const entry = monthData.balances.find(b => b.item === item && b.trx_type === 'CRYPTO');
      if (entry) {
         setFormData(prev => ({ ...prev, [field]: entry.amount.toString() }));
         return;
      }
    }
  };

  const fetchFxRates = useCallback(async (dateStr: string): Promise<Record<string, number>> => {
    const rates: Record<string, number> = {
      AUD: 1.0,
      HKD: 0.20, // Fallback
      BTC: 100000, // Fallback
      ETH: 4000, // Fallback
      XRP: 4.0 // Fallback
    };

    const coingeckoApiKey = import.meta.env.VITE_COINGECKO_API_KEY || '';
    const authParam = coingeckoApiKey ? `&x_cg_demo_api_key=${coingeckoApiKey}` : '';

    const today = new Date().toISOString().split('T')[0];
    const isCurrentOrFuture = dateStr >= today;

    // 1. Fiat (HKD) - Frankfurter
    try {
        const url = isCurrentOrFuture 
            ? 'https://api.frankfurter.app/latest?from=HKD&to=AUD'
            : `https://api.frankfurter.app/${dateStr}?from=HKD&to=AUD`;
            
        const fiatRes = await fetch(url);
        if (fiatRes.ok) {
            const fiatData = await fiatRes.json();
            if (fiatData.rates?.AUD) rates.HKD = fiatData.rates.AUD;
        }
    } catch (e) {
        console.warn('Fiat rate fetch failed', e);
    }

    // 2. Crypto (BTC, ETH, XRP) - CoinGecko
    try {
        if (isCurrentOrFuture) {
            // Single API call for all crypto to avoid 429
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=aud${authParam}`);
            if (res.ok) {
                const data = await res.json();
                if (data.bitcoin?.aud) rates.BTC = data.bitcoin.aud;
                if (data.ethereum?.aud) rates.ETH = data.ethereum.aud;
                if (data.ripple?.aud) rates.XRP = data.ripple.aud;
            }
        } else {
             // Historical - must be sequential to avoid 429 on free tier
             const coins = [
                { id: 'bitcoin', symbol: 'BTC' },
                { id: 'ethereum', symbol: 'ETH' },
                { id: 'ripple', symbol: 'XRP' }
            ];
            
            const [year, month, day] = dateStr.split('-');
            const coingeckoDate = `${day}-${month}-${year}`; // dd-mm-yyyy

            // Execute sequentially
            for (const coin of coins) {
                try {
                    // Small delay to be polite to the API
                    if (coins.indexOf(coin) > 0) {
                        await new Promise(r => setTimeout(r, 250));
                    }
                    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/history?date=${coingeckoDate}&localization=false${authParam}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.market_data?.current_price?.aud) {
                            rates[coin.symbol] = data.market_data.current_price.aud;
                        }
                    }
                } catch (err) {
                     console.warn(`Failed to fetch history for ${coin.symbol}`, err);
                }
            }
        }
    } catch (e) {
        console.warn('Crypto rate fetch failed', e);
    }

    return rates;
  }, []);

  // Update rates when date changes or modal opens
  useEffect(() => {
    if (isModalOpen && formData.date) {
        let isMounted = true;
        const load = async () => {
            setLoadingRates(true);
            const rates = await fetchFxRates(formData.date);
            if (isMounted) {
                setCurrentRates(rates);
                setLoadingRates(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }
  }, [isModalOpen, formData.date, fetchFxRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // Use current rates from state (fetched by useEffect)
        const rates = currentRates; 
        
        const promises: Promise<void>[] = [];

        // Helper to push requests
        const pushRequest = (amountStr: string, item: string, currency: string, type: 'CASH' | 'STOCK' | 'CRYPTO', manualRate?: number) => {
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0) {
                const rate = manualRate || rates[currency] || 1;
                const payload: BalancePayload = {
                    inputdate: formData.date,
                    item,
                    amount,
                    currency,
                    base_currency: 'AUD',
                    fx_rate: rate,
                    active: true,
                    trx_type: type
                };
                promises.push(saveBalanceItem(payload));
            }
        };

        pushRequest(formData.bankAud, 'BANK', 'AUD', 'CASH', 1);
        pushRequest(formData.bankHkd, 'BANK', 'HKD', 'CASH');
        pushRequest(formData.ibkrAud, 'IBKR', 'AUD', 'STOCK', 1);
        pushRequest(formData.btc, 'BTC', 'BTC', 'CRYPTO');
        pushRequest(formData.xrp, 'XRP', 'XRP', 'CRYPTO');
        pushRequest(formData.eth, 'ETH', 'ETH', 'CRYPTO');

        await Promise.all(promises);

        setIsModalOpen(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            bankAud: '',
            bankHkd: '',
            ibkrAud: '',
            btc: '',
            xrp: '',
            eth: ''
        });
        
        if (onRefresh) {
            onRefresh();
        }
    } catch (error) {
        alert('Failed to save transactions. Check console for details.');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:ml-64 sm:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
            <h1 className="text-2xl font-bold text-white">Transactions History</h1>
            <p className="text-slate-400">Monthly breakdown of asset balances and portfolio performance.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
        >
            <Plus size={16} />
            Add Transaction
        </button>
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

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Add Transactions</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">Date</label>
                <input 
                  type="date" 
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* CASH */}
                <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                   <h3 className="flex items-center gap-2 font-semibold text-emerald-400">
                      CASH
                   </h3>
                   <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Bank (AUD)</label>
                      <input type="number" step="0.01" name="bankAud" value={formData.bankAud} onChange={handleInputChange} placeholder="0.00" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-emerald-500" />
                   </div>
                   <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Bank (HKD)</label>
                      <input type="number" step="0.01" name="bankHkd" value={formData.bankHkd} onChange={handleInputChange} placeholder="0.00" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-emerald-500" />
                      <div className="mt-1 text-xs text-slate-500">
                         {loadingRates ? 'Fetching rate...' : `Rate: ${currentRates.HKD?.toFixed(4) ?? '-'} AUD`}
                      </div>
                   </div>
                </div>

                {/* STOCK */}
                <div className="space-y-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                   <h3 className="flex items-center gap-2 font-semibold text-indigo-400">
                      STOCK
                   </h3>
                   <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">IBKR (AUD)</label>
                      <input type="number" step="0.01" name="ibkrAud" value={formData.ibkrAud} onChange={handleInputChange} placeholder="0.00" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-indigo-500" />
                   </div>
                </div>

                {/* CRYPTO */}
                <div className="col-span-1 space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 md:col-span-2">
                   <div className="flex items-center justify-between">
                       <h3 className="flex items-center gap-2 font-semibold text-violet-400">
                          CRYPTO
                       </h3>
                       <a 
                         href="https://www.coingecko.com" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
                       >
                         Powered by CoinGecko
                       </a>
                   </div>
                   <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-slate-500">BTC</label>
                                <button 
                                    type="button"
                                    onClick={() => handleAutoFill('btc', 'BTC')}
                                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                                    title="Use amount from last month"
                                >
                                    <History size={10} />
                                    <span>Last</span>
                                </button>
                            </div>
                            <input type="number" step="0.00000001" name="btc" value={formData.btc} onChange={handleInputChange} placeholder="0.00000000" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-violet-500" />
                            <div className="mt-1 text-xs text-slate-500">
                               {loadingRates ? 'Fetching rate...' : `Rate: ${currentRates.BTC?.toFixed(2) ?? '-'} AUD`}
                            </div>
                        </div>
                        <div>
                             <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-slate-500">ETH</label>
                                <button 
                                    type="button"
                                    onClick={() => handleAutoFill('eth', 'ETH')}
                                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                                    title="Use amount from last month"
                                >
                                    <History size={10} />
                                    <span>Last</span>
                                </button>
                            </div>
                            <input type="number" step="0.00000001" name="eth" value={formData.eth} onChange={handleInputChange} placeholder="0.00000000" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-violet-500" />
                            <div className="mt-1 text-xs text-slate-500">
                               {loadingRates ? 'Fetching rate...' : `Rate: ${currentRates.ETH?.toFixed(2) ?? '-'} AUD`}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-slate-500">XRP</label>
                                <button 
                                    type="button"
                                    onClick={() => handleAutoFill('xrp', 'XRP')}
                                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                                    title="Use amount from last month"
                                >
                                    <History size={10} />
                                    <span>Last</span>
                                </button>
                            </div>
                            <input type="number" step="0.000001" name="xrp" value={formData.xrp} onChange={handleInputChange} placeholder="0.000000" className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-white outline-none focus:border-violet-500" />
                            <div className="mt-1 text-xs text-slate-500">
                               {loadingRates ? 'Fetching rate...' : `Rate: ${currentRates.XRP?.toFixed(4) ?? '-'} AUD`}
                            </div>
                        </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || loadingRates}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Save Transactions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;