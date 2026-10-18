import React from 'react';
import FloatingCurrencySelector from '../components/FloatingCurrencySelector';
import { CurrencyProvider } from '../context/CurrencyContext';
import { RouteProvider } from '../shims/react-router-dom';

// Only needs the currency context (not the full provider stack).
const CurrencySelectorIsland: React.FC<{ path?: string }> = ({ path = '/pricing' }) => (
  <RouteProvider pathname={path} params={{}}>
    <CurrencyProvider>
      <FloatingCurrencySelector />
    </CurrencyProvider>
  </RouteProvider>
);
export default CurrencySelectorIsland;
