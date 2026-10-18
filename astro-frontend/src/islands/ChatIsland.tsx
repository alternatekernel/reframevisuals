import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReframeCS from '../components/ReframeCS';
import { routed } from './routed';

const FOCUSED = ['/free-trial', '/start', '/pilot-batch', '/contact', '/order/new'];
const AUTH = ['/login', '/signup', '/forgot-password', '/reset-password'];

const View: React.FC = () => {
  useEffect(() => {
    const onVis = () => document.documentElement.classList.toggle('animations-paused', document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  const { pathname } = useLocation();
  return FOCUSED.includes(pathname) || AUTH.includes(pathname) ? null : <ReframeCS />;
};
export default routed(View);
