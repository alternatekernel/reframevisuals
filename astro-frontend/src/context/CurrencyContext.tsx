import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'AED';

type CurrencySource = 'auto' | 'manual';

interface CurrencyState {
  currency: SupportedCurrency;
  source: CurrencySource;
  rates: Record<SupportedCurrency, number>; // relative to USD base
  setCurrencyManual: (currency: SupportedCurrency) => void;
  resetCurrencyAuto: () => void;
  convertFromUsd: (amountUsd: number) => number;
}

const STORAGE_KEY = 'rv_currency_pref_v1';

const DEFAULT_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  CAD: 1.37,
  AUD: 1.52,
  AED: 3.67,
};

const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  IN: 'INR',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  BE: 'EUR',
  IE: 'EUR',
};

const CurrencyContext = createContext<CurrencyState | null>(null);

const getAutoCurrency = (): SupportedCurrency => {
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();
    if (region && COUNTRY_TO_CURRENCY[region]) return COUNTRY_TO_CURRENCY[region];
    return 'USD';
  } catch {
    return 'USD';
  }
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [source, setSource] = useState<CurrencySource>('auto');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setCurrency(getAutoCurrency());
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { currency?: SupportedCurrency; source?: CurrencySource };
      if (parsed.source === 'manual' && parsed.currency) {
        setCurrency(parsed.currency);
        setSource('manual');
        return;
      }
      setCurrency(getAutoCurrency());
      setSource('auto');
    } catch {
      setCurrency(getAutoCurrency());
      setSource('auto');
    }
  }, []);

  const setCurrencyManual = useCallback((next: SupportedCurrency) => {
    setCurrency(next);
    setSource('manual');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency: next, source: 'manual' }));
  }, []);

  const resetCurrencyAuto = useCallback(() => {
    const next = getAutoCurrency();
    setCurrency(next);
    setSource('auto');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency: next, source: 'auto' }));
  }, []);

  const convertFromUsd = useCallback((amountUsd: number) => {
    const rate = DEFAULT_RATES[currency] ?? 1;
    return amountUsd * rate;
  }, [currency]);

  const value = useMemo<CurrencyState>(() => ({
    currency,
    source,
    rates: DEFAULT_RATES,
    setCurrencyManual,
    resetCurrencyAuto,
    convertFromUsd,
  }), [currency, source, setCurrencyManual, resetCurrencyAuto, convertFromUsd]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyState => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
