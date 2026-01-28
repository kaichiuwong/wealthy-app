// API specific types
export interface BalanceItem {
  id: number;
  inputdate: string;
  item: string;
  amount: number;
  currency: string;
  base_currency: string;
  fx_rate: number;
  active: boolean;
  trx_type: 'CASH' | 'STOCK' | 'CRYPTO';
}

export interface BreakdownItem {
  total: number;
  percentage: number;
}

export interface Summary {
  total: number;
  breakdown: {
    CASH: BreakdownItem;
    STOCK: BreakdownItem;
    CRYPTO: BreakdownItem;
  };
}

export interface MonthData {
  balances: BalanceItem[];
  summary: Summary;
}

export interface ApiResponse {
  balances: Record<string, MonthData>;
}

export interface CheckUserEmailResponse {
  exists: boolean;
  user?: any;
  token?: string;
  message?: string;
}

// UI State types
export interface ChartDataPoint {
  month: string;
  displayDate: string;
  total: number;
  cash: number;
  stock: number;
  crypto: number;
  rawDate: Date;
}

export type AssetType = 'CASH' | 'STOCK' | 'CRYPTO';

// Global declarations for Vite environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly VITE_COINGECKO_API_KEY: string;
    readonly VITE_ALLOWED_EMAILS: string;
    readonly VITE_BASE_URL: string;
    readonly VITE_JWT_SECRET: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}