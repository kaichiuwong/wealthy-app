export const formatCurrency = (amount: number, currency: string = 'AUD'): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const parseDateKey = (key: string): Date => {
  // expects "YYYY-MM"
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1);
};

export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};