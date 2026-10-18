import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { setSsrPath } from '../shims/react-router-dom';
import { withProviders } from './Providers';

const NavigationIsland: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  setSsrPath(currentPath);
  const [open, setOpen] = useState(false);
  return <Navigation mobileMenuOpen={open} setMobileMenuOpen={setOpen} />;
};
export default withProviders(NavigationIsland);
