import React from 'react';
import Footer from '../components/Footer';
import { setSsrPath } from '../shims/react-router-dom';
import { withProviders } from './Providers';

const FooterIsland: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  setSsrPath(currentPath);
  return <Footer />;
};
export default withProviders(FooterIsland);
