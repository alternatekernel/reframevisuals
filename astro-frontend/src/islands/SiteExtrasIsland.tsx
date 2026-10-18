import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReframeCS from '../components/ReframeCS';
import CookieConsent from '../components/common/CookieConsent';
import ContinueBrowsing from '../components/ContinueBrowsing';
import { routed } from './routed';

// Mirrors the visibility rules of PublicSite in frontend/src/App.tsx.
const FOCUSED = ['/free-trial', '/start', '/pilot-batch', '/contact', '/order/new'];
const AUTH = ['/login', '/signup', '/forgot-password', '/reset-password'];
const ABOUT = ['/about', '/about-reframe-visuals'];

const useVisibilityAnimationPause = () => {
  useEffect(() => {
    const onVisibility = () => document.documentElement.classList.toggle('animations-paused', document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
};

const SiteExtras: React.FC = () => {
  useVisibilityAnimationPause();
  const { pathname } = useLocation();
  const focused = FOCUSED.includes(pathname);
  const auth = AUTH.includes(pathname);
  const showAssistant = !focused && !auth;
  const showContinue = pathname !== '/' && !auth && !focused && !ABOUT.includes(pathname) && pathname !== '/order';
  return (
    <>
      {showContinue && <ContinueBrowsing />}
      {showAssistant && <ReframeCS />}
      <CookieConsent />
    </>
  );
};

export default routed(SiteExtras);
