import React from 'react';
import { LayoutDashboard, PieChart, Wallet, Settings, LogOut, TrendingUp } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'transactions';
  onNavigate: (view: 'dashboard' | 'transactions') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const getLinkClass = (view: 'dashboard' | 'transactions') => {
    const isActive = currentView === view;
    return `flex w-full items-center rounded-lg p-3 transition duration-75 group ${
      isActive 
        ? 'bg-slate-800 text-white' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-slate-800 bg-slate-950 transition-transform sm:translate-x-0">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-10 flex items-center pl-2.5">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <span className="self-center whitespace-nowrap text-xl font-bold text-white">Wealthy</span>
        </div>
        
        <ul className="space-y-2 font-medium">
          <li>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={getLinkClass('dashboard')}
            >
              <LayoutDashboard className={`h-5 w-5 ${currentView === 'dashboard' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="ml-3">Dashboard</span>
            </button>
          </li>
          <li>
            <a href="#" className="flex items-center rounded-lg p-3 text-slate-400 hover:bg-slate-800 hover:text-white group">
              <PieChart className="h-5 w-5 transition duration-75 group-hover:text-white" />
              <span className="ml-3">Analytics</span>
            </a>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('transactions')}
              className={getLinkClass('transactions')}
            >
              <Wallet className={`h-5 w-5 ${currentView === 'transactions' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="ml-3">Transactions</span>
            </button>
          </li>
        </ul>
        
        <div className="mt-auto">
          <ul className="space-y-2 font-medium border-t border-slate-800 pt-4">
            <li>
              <a href="#" className="flex items-center rounded-lg p-3 text-slate-400 hover:bg-slate-800 hover:text-white group">
                <Settings className="h-5 w-5 transition duration-75 group-hover:text-white" />
                <span className="ml-3">Settings</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center rounded-lg p-3 text-slate-400 hover:bg-slate-800 hover:text-white group">
                <LogOut className="h-5 w-5 transition duration-75 group-hover:text-white" />
                <span className="ml-3">Sign Out</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;