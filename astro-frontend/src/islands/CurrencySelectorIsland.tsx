import React from 'react';
import FloatingCurrencySelector from '../components/FloatingCurrencySelector';
import { setSsrPath } from '../shims/react-router-dom';
import { withProviders } from './Providers';

const CurrencySelectorIsland: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  setSsrPath(currentPath);
  return <FloatingCurrencySelector />;
};
export default withProviders(CurrencySelectorIsland);
