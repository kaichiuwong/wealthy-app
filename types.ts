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