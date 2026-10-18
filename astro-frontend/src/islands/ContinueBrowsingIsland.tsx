import React from 'react';
import { useLocation } from 'react-router-dom';
import ContinueBrowsing from '../components/ContinueBrowsing';
import { routed } from './routed';

// Same visibility rules as PublicSite in frontend/src/App.tsx; rendered above the footer like the original.
const HIDDEN = ['/', '/order', '/login', '/signup', '/forgot-password', '/reset-password', '/free-trial', '/start', '/pilot-batch', '/contact', '/order/new', '/about', '/about-reframe-visuals'];

const View: React.FC = () => {
  const { pathname } = useLocation();
  return HIDDEN.includes(pathname) ? null : <ContinueBrowsing />;
};
export default routed(View);
