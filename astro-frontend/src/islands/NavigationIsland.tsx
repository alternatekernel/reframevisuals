import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { routed } from './routed';

const NavigationView: React.FC = () => {
  const [open, setOpen] = useState(false);
  return <Navigation mobileMenuOpen={open} setMobileMenuOpen={setOpen} />;
};
export default routed(NavigationView);
