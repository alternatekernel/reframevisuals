// Currency conversion for server-rendered prices. Any element with [data-usd="12.34"] is rewritten to the visitor's
// currency (same rates, locale detection and localStorage key as context/CurrencyContext.tsx).
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'AED';

export const RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.2, CAD: 1.37, AUD: 1.52, AED: 3.67 };
const SYMBOL: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$', AED: 'د.إ' };
const COUNTRY: Record<string, Currency> = { IN: 'INR', GB: 'GBP', CA: 'CAD', AU: 'AUD', AE: 'AED', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', PT: 'EUR', BE: 'EUR', IE: 'EUR' };
const KEY = 'rv_currency_pref_v1';

export const formatMoney = (amount: number, currency: Currency): string => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${SYMBOL[currency] ?? ''}${amount.toFixed(2)}`;
  }
};

const auto = (): Currency => {
  try {
    const region = (navigator.language || 'en-US').split('-')[1]?.toUpperCase();
    return (region && COUNTRY[region]) || 'USD';
  } catch { return 'USD'; }
};

export function getCurrency(): Currency {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null') as { currency?: Currency; source?: string } | null;
    if (parsed?.source === 'manual' && parsed.currency && parsed.currency in RATES) return parsed.currency;
  } catch { /* ignore */ }
  return auto();
}

export function setCurrency(currency: Currency) {
  try { localStorage.setItem(KEY, JSON.stringify({ currency, source: 'manual' })); } catch { /* ignore */ }
  apply();
  window.dispatchEvent(new CustomEvent('rv-currency', { detail: { currency } }));
}

export function apply(root: ParentNode = document) {
  const currency = getCurrency();
  document.documentElement.dataset.currency = currency;
  root.querySelectorAll<HTMLElement>('[data-usd]').forEach((el) => {
    const usd = Number(el.dataset.usd);
    if (!Number.isFinite(usd)) return;
    el.textContent = formatMoney(usd * (RATES[currency] ?? 1), currency);
  });
}

if (typeof window !== 'undefined') {
  apply();
  document.addEventListener('astro:page-load', () => apply());
  window.addEventListener('storage', (e) => { if (e.key === KEY) apply(); });
  (window as any).rvCurrency = { get: getCurrency, set: setCurrency, apply, format: formatMoney, rates: RATES };
}
