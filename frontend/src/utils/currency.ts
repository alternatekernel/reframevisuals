import type { SupportedCurrency } from '../context/CurrencyContext';

export const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  AED: 'د.إ',
};

export const formatCurrency = (amount: number, currency: SupportedCurrency): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOL[currency] ?? ''}${amount.toFixed(2)}`;
  }
};
