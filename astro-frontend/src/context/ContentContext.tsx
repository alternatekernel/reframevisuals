import React, { useState, useEffect, useCallback } from 'react';
import { ContentContext } from './ContentBase';
import { AdminSectionMeta, ThemeSettings, DEFAULT_THEME } from '../admin/types';
import { sectionsAPI, themeAPI, authAPI } from '../services/api';
import { portalApi } from '../services/portalApi';
import { isExcludedService } from './ServicesContext';

import { ALL_SECTION_DEFAULTS } from '../data/siteDefaults';

// ─── Context Types ───

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  customerCode?: string;
  isGuest?: boolean;
  onboardingCompleted?: boolean;
  role?: string;
  companyName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  industry?: string | null;
  avatarUrl?: string | null;
}

export interface ChangedField {
  sectionId: string;
  sectionLabel: string;
  fieldKey: string;
  oldValue: any;
  newValue: any;
}

// ─── Apply theme CSS variables to :root ───

function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;

  // Convert hex to RGB for shadow effects
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '233, 116, 81';
  };

  // Fonts
  root.style.setProperty('--font-heading', `'${theme.fonts.heading}', sans-serif`);
  root.style.setProperty('--font-body', `'${theme.fonts.body}', sans-serif`);
  root.style.setProperty('--font-mono', `'${theme.fonts.mono}', monospace`);

  // Colors
  root.style.setProperty('--brand', theme.colors.brand);
  root.style.setProperty('--brand-rgb', hexToRgb(theme.colors.brand));
  root.style.setProperty('--brand-hover', theme.colors.brandHover);
  root.style.setProperty('--brand-hover-rgb', hexToRgb(theme.colors.brandHover));
  root.style.setProperty('--surface', '#FFFFFF'); // FORCE pure white
  root.style.setProperty('--onyx', theme.colors.onyx);
  root.style.setProperty('--cat-foundation', theme.colors.categoryFoundation);
  root.style.setProperty('--cat-enhancement', theme.colors.categoryEnhancement);
  root.style.setProperty('--cat-retouch', theme.colors.categoryRetouch);
  root.style.setProperty('--cat-advanced', theme.colors.categoryAdvanced);
  root.style.setProperty('--ambient-orb', theme.colors.ambientOrb);
  root.style.setProperty('--chat-bubbles', theme.colors.chatBubbles);
  root.style.setProperty('--footer-dark', theme.colors.footerDark);
  root.style.setProperty('--accent-lavender', theme.colors.accentLavender);

  // Typography
  root.style.setProperty('--base-font-size', `${theme.typography.baseFontSize}px`);
  root.style.setProperty('--heading-scale', String(theme.typography.headingScale));
  root.style.setProperty('--line-height', String(theme.typography.lineHeight));
  root.style.setProperty('--letter-spacing', `${theme.typography.letterSpacing}em`);

  // Radius
  root.style.setProperty('--radius-sm', `${theme.radius.sm}px`);
  root.style.setProperty('--radius-md', `${theme.radius.md}px`);
  root.style.setProperty('--radius-lg', `${theme.radius.lg}px`);
  root.style.setProperty('--radius-xl', `${theme.radius.xl}px`);

  // Dynamically load fonts from Google Fonts (only for Google Fonts, not Fontshare)
  const googleFonts = ['Google Sans', 'DM Sans', 'JetBrains Mono', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Raleway', 'Oswald', 'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Ubuntu', 'PT Sans', 'Crimson Text', 'Work Sans', 'Karla', 'Libre Baskerville'];
  
  const allFonts = [
    theme.fonts.heading,
    theme.fonts.body,
    theme.fonts.mono,
  ];
  
  const fontsToLoad = allFonts
    .filter((f, i, arr) => arr.indexOf(f) === i)
    .filter(f => googleFonts.some(gf => f.toLowerCase().includes(gf.toLowerCase())));
  
  if (fontsToLoad.length === 0) return; // Skip if all fonts are from Fontshare
  
  const weights = '300;400;500;600;700;800;900';
  const fontFamilies = fontsToLoad
    .map(f => `family=${f.replace(/ /g, '+')}:wght@${weights}`)
    .join('&');

  const href = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

  const existing = document.getElementById('dynamic-fonts');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = 'dynamic-fonts';
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// ─── Provider ───

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<Record<string, Record<string, any>>>(() => {
    try {
      const saved = localStorage.getItem('reframe-content');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<string, Record<string, any>> = {};
        for (const [key, defaults] of Object.entries(ALL_SECTION_DEFAULTS)) {
          merged[key] = { ...defaults, ...(parsed[key] || {}) };
        }
        for (const [key, value] of Object.entries(parsed)) {
          if (!merged[key]) {
            merged[key] = value as Record<string, any>;
          }
        }
        if (merged.hero?.cta1Label === 'Get 3 Image Edits Free' || merged.hero?.cta1Label === 'Get your Free trial') {
          merged.hero.cta1Label = 'Get Your Free Trial';
        }
        if (merged.services?.services && Array.isArray(merged.services.services)) {
          merged.services.services = merged.services.services.filter((s: any) => !isExcludedService(s));
        }
        if (merged.pricingMatrix?.rows && Array.isArray(merged.pricingMatrix.rows)) {
          let currentService = '';
          merged.pricingMatrix.rows = merged.pricingMatrix.rows.filter((row: any) => {
            if (row.service) currentService = row.service;
            return !isExcludedService({ name: currentService });
          });
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load content from localStorage:', e);
    }
    return { ...ALL_SECTION_DEFAULTS };
  });

  const [theme, setThemeState] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('reframe-theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force update old surface color to new one
        if (parsed.colors?.surface === '#F8F9FD' || parsed.colors?.surface === '#F5F2ED') {
          parsed.colors.surface = '#FFFFFF';
          localStorage.setItem('reframe-theme', JSON.stringify(parsed));
        }
        return {
          fonts: { heading: 'Google Sans', body: 'Google Sans', mono: 'JetBrains Mono' },
          colors: { 
            ...DEFAULT_THEME.colors, 
            ...parsed.colors,
            surface: '#FFFFFF', // Always force pure white
          },
          typography: { ...DEFAULT_THEME.typography, ...parsed.typography },
          radius: { ...DEFAULT_THEME.radius, ...parsed.radius },
        };
      }
    } catch (e) {
      console.warn('Failed to load theme from localStorage:', e);
    }
    return {
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        surface: '#FFFFFF', // Force pure white
      },
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Initial session validation
  useEffect(() => {
    if (isAdminRoute) {
      setIsAuthChecking(false);
      return;
    }

    const validateSession = async () => {
      const adminToken = localStorage.getItem('reframe-token');
      const portalToken = localStorage.getItem('portal_token');
      const savedUser = localStorage.getItem('reframe-current-user');
      
      if (!adminToken && !portalToken) {
        localStorage.removeItem('reframe-current-user');
        localStorage.removeItem('reframe-auth');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthChecking(false);
        return;
      }

      try {
        // Do not trust cached users before backend validation. A stale saved
        // user was making first-time/guest visitors look logged in.

        if (portalToken) {
          const response = await portalApi.getMe();
          if (response.data && response.data.success && response.data.data && !response.data.data.isGuest) {
            const user = response.data.data;
            const cached = savedUser ? JSON.parse(savedUser) : {};
            setCurrentUser({ ...cached, ...user });
            setIsAuthenticated(true);
            localStorage.setItem('reframe-current-user', JSON.stringify({ ...cached, ...user }));
          } else {
            throw new Error('Invalid portal session');
          }
        } else if (adminToken && savedUser) {
          setCurrentUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid session');
        }
      } catch (err) {
        console.warn('Session validation failed, clearing stale auth:', err);
        localStorage.removeItem('reframe-token');
        localStorage.removeItem('portal_token');
        localStorage.removeItem('reframe-current-user');
        localStorage.removeItem('reframe-auth');
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    validateSession();
  }, [isAdminRoute]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserAuthenticated = !!currentUser;

  const [registeredSections, setRegisteredSections] = useState<AdminSectionMeta[]>([]);

  // Auto-discover adminMeta from all modules (admin routes only).
  // Running this on public routes forces loading every page/admin chunk,
  // which can cause blank screens on low-memory mobile browsers.
  useEffect(() => {
    if (!isAdminRoute) {
      setRegisteredSections([]);
      return;
    }

    const discoverSections = async () => {
      try {
        // Only scan relevant directories to save memory/time
        const modules = import.meta.glob(['../sections/*.tsx', '../admin/pages/*.tsx', '../pages/*.tsx']);
        const discovered: AdminSectionMeta[] = [];

        for (const path in modules) {
          try {
            const mod = await modules[path]() as any;
            if (mod && mod.adminMeta) {
              discovered.push(mod.adminMeta);
            }
          } catch (err) {
            // Silently skip modules that fail to load or have side effects
          }
        }
        setRegisteredSections(discovered);
      } catch (e) {
        console.warn('Auto-discovery failed:', e);
      }
    };

    discoverSections();
  }, [isAdminRoute]);

  // Check for portal session on mount
  useEffect(() => {
    if (isAdminRoute) return;

    const checkSession = async () => {
      // If user explicitly logged out, don't try to restore session
      if (localStorage.getItem('portal_logged_out') === 'true') return;
      // Auth lives in an httpOnly cookie — always call /me so a valid cookie
      // restores the session even if localStorage was cleared between reloads.
      try {
        const response = await portalApi.getMe();
        if (response.data.success && response.data.data && !response.data.data.isGuest) {
          setCurrentUser(response.data.data);
          setIsAuthenticated(true);
          localStorage.setItem('reframe-current-user', JSON.stringify(response.data.data));
          if (response.data.data.token) {
            localStorage.setItem('portal_token', response.data.data.token);
          }
        }
      } catch (err) {
        // Not logged in or session expired — silently ignore
      }
    };
    checkSession();
  }, [isAdminRoute]);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync with backend on mount (public theme loading)
  useEffect(() => {
    syncThemeWithBackend();
  }, []);

  // Sync with backend on mount if authenticated (full sync)
  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend();
    }
  }, [isAuthenticated]);

  const syncThemeWithBackend = useCallback(async () => {
    // Always try to load theme from backend (public endpoint)
    try {
      const themeResponse = await themeAPI.get();
      if (themeResponse.success && themeResponse.data) {
        // Backend now returns properly nested ThemeSettings structure
        setThemeState(themeResponse.data);
      }
    } catch (error) {
      console.warn('Failed to load theme from backend, using defaults:', error);
    }
  }, []);

  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch sections from backend
      const sectionsResponse = await sectionsAPI.getAll();
      if (sectionsResponse.success) {
        const backendSections: Record<string, Record<string, any>> = {};
        for (const section of sectionsResponse.data) {
          backendSections[section.sectionId] = section.content;
        }
        
        // Merge with defaults
        const merged: Record<string, Record<string, any>> = {};
        for (const [key, defaults] of Object.entries(ALL_SECTION_DEFAULTS)) {
          merged[key] = { ...defaults, ...(backendSections[key] || {}) };
        }
        if (merged.services?.services && Array.isArray(merged.services.services)) {
          merged.services.services = merged.services.services.filter((s: any) => !isExcludedService(s));
        }
        if (merged.pricingMatrix?.rows && Array.isArray(merged.pricingMatrix.rows)) {
          let currentService = '';
          merged.pricingMatrix.rows = merged.pricingMatrix.rows.filter((row: any) => {
            if (row.service) currentService = row.service;
            return !isExcludedService({ name: currentService });
          });
        }
        setSections(merged);
      }

      // Fetch theme from backend
      const themeResponse = await themeAPI.get();
      if (themeResponse.success) {
        const backendTheme = themeResponse.data;
        setThemeState(prev => ({
          fonts: { 
            heading: 'Google Sans',
            body: 'Google Sans',
            mono: 'JetBrains Mono',
          },
          colors: {
            brand: backendTheme.brand || prev.colors.brand,
            brandHover: backendTheme.brandHover || prev.colors.brandHover,
            surface: '#FFFFFF', // Force pure white
            onyx: backendTheme.onyx || prev.colors.onyx,
            categoryFoundation: backendTheme.categoryFoundation || prev.colors.categoryFoundation,
            categoryEnhancement: backendTheme.categoryEnhancement || prev.colors.categoryEnhancement,
            categoryRetouch: backendTheme.categoryRetouch || prev.colors.categoryRetouch,
            categoryAdvanced: backendTheme.categoryAdvanced || prev.colors.categoryAdvanced,
            ambientOrb: backendTheme.ambientOrb || prev.colors.ambientOrb,
            chatBubbles: backendTheme.chatBubbles || prev.colors.chatBubbles,
            footerDark: backendTheme.footerDark || prev.colors.footerDark,
            accentLavender: backendTheme.accentLavender || prev.colors.accentLavender,
          },
          typography: {
            baseFontSize: backendTheme.baseFontSize || prev.typography.baseFontSize,
            headingScale: backendTheme.headingScale || prev.typography.headingScale,
            lineHeight: backendTheme.lineHeight || prev.typography.lineHeight,
            letterSpacing: backendTheme.letterSpacing || prev.typography.letterSpacing,
          },
          radius: {
            sm: backendTheme.radiusSm || prev.radius.sm,
            md: backendTheme.radiusMd || prev.radius.md,
            lg: backendTheme.radiusLg || prev.radius.lg,
            xl: backendTheme.radiusXl || prev.radius.xl,
          },
        }));
      }
    } catch (err: any) {
      console.error('Failed to sync with backend:', err);
      setError(err.message || 'Failed to sync with backend');
      // Fallback to localStorage
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getSectionContent = useCallback((id: string) => {
    return sections[id] || ALL_SECTION_DEFAULTS[id] || {};
  }, [sections]);

  const setSectionContent = useCallback((id: string, content: Record<string, any>) => {
    setSections(prev => ({ ...prev, [id]: content }));
    setIsDirty(true);
  }, []);

  const resetSection = useCallback((id: string) => {
    setSections(prev => ({
      ...prev,
      [id]: ALL_SECTION_DEFAULTS[id] ? { ...ALL_SECTION_DEFAULTS[id] } : {},
    }));
    setIsDirty(true);
  }, []);

  const setTheme = useCallback((partial: Partial<ThemeSettings>) => {
    setThemeState(prev => ({
      fonts: { ...prev.fonts, ...(partial.fonts || {}) },
      colors: { ...prev.colors, ...(partial.colors || {}) },
      typography: { ...prev.typography, ...(partial.typography || {}) },
      radius: { ...prev.radius, ...(partial.radius || {}) },
    }));
    setIsDirty(true);
  }, []);

  const resetTheme = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setIsDirty(true);
  }, []);


  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('reframe-auth');
    localStorage.removeItem('reframe-token');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('reframe-current-user');
  }, []);

  const userLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // 1. Try Portal Login (Customers)
      try {
        const portalResponse = await portalApi.login(email, password);
        if (portalResponse.data.success) {
          const user = portalResponse.data.data;
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('reframe-current-user', JSON.stringify(user));
          if (user.token) {
            localStorage.setItem('portal_token', user.token);
          }
          if (user.customerCode) {
            localStorage.setItem('customer_code', user.customerCode);
          }
          localStorage.removeItem('portal_logged_out');
          return { success: true };
        }
      } catch (portalErr: any) {
        // If it's a 401/403, it might be the wrong credentials for a customer, 
        // but we still want to try the Staff API.
      }

      // 2. Try Backend Auth API (Staff)
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('reframe-token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        
        setTimeout(() => syncWithBackend(), 100);
        return { success: true };
      }
      return { success: false, message: 'Invalid email or password' };
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  }, [syncWithBackend]);

  const googleLogin = useCallback(async (credential: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.googleAuth(credential);
      if (response.data.success) {
        const user = response.data.data;
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('portal_token', user.token);
        }
        if (user.customerCode) {
          localStorage.setItem('customer_code', user.customerCode);
        }
        localStorage.removeItem('portal_logged_out');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Google sign-in failed' };
    } catch (err: any) {
      console.error('Google login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Google sign-in failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.register({ name, email, password });
      if (response.data.success) {
        const user = response.data.data;
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('portal_token', user.token);
        }
        if (user.customerCode) {
          localStorage.setItem('customer_code', user.customerCode);
        }
        localStorage.removeItem('portal_logged_out');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Signup failed' };
    } catch (err: any) {
      console.error('Signup failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.forgotPassword(email);
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Request failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.resetPassword(token, newPassword);
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Reset failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const userLogout = useCallback(async () => {
    try {
      await portalApi.logout();
    } catch (err) {
      console.warn('Portal logout failed:', err);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('reframe-current-user');
    localStorage.removeItem('reframe-token');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('reframe-auth');
    localStorage.removeItem('customer_code');
    localStorage.removeItem('portal_guest_id');
    localStorage.removeItem('reframe_cs_conv_id');
    localStorage.removeItem('reframe_cs_messages');
    localStorage.removeItem('reframe_cs_last_admin_msg_id');
    localStorage.removeItem('reframe_cs_identity');
    localStorage.removeItem('reframe_cs_contact_captured');
    localStorage.setItem('portal_logged_out', 'true');
    window.dispatchEvent(new Event('portal-logout'));
  }, []);

  // ─── Global change tracking ───

  // Optimized deep equality check to replace expensive JSON.stringify
  const isEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }, []);

  const [savedSnapshot, setSavedSnapshot] = useState<{ sections: Record<string, Record<string, any>>; theme: ThemeSettings }>({
    sections: JSON.parse(JSON.stringify(sections)),
    theme: JSON.parse(JSON.stringify(theme)),
  });

  const hasUnsavedChanges = React.useMemo(() => {
    return isDirty;
  }, [isDirty]);

  const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero Banner', ticker: 'Scrolling Bar', stats: 'Statistics',
    faq: 'Questions & Answers', differentiators: 'Why Us', workflow: 'How It Works',
    integrations: 'Integrations', cta: 'Call to Action', navigation: 'Top Menu',
    footer: 'Footer', chatWidget: 'Chat Assistant', services: 'All Services',
    bundles: 'Service Bundles', pricingMatrix: 'Price Table', pricingPlans: 'Pricing Cards',
    servicesPage: 'Services Page', pricingPage: 'Pricing Page', aboutPage: 'About Page',
    insightsPage: 'Blog Page', freeTrial: 'Free Trial Page', bookMeeting: 'Book Meeting Page',
    serviceDetail: 'Service Detail', images: 'Images & Links', usecases: 'Customer Scenarios',
  };

  const getChangedFields = useCallback((): ChangedField[] => {
    const changes: ChangedField[] = [];

    for (const [sectionId, current] of Object.entries(sections)) {
      const original = savedSnapshot.sections[sectionId];
      if (!original) {
        changes.push({ sectionId, sectionLabel: SECTION_LABELS[sectionId] || sectionId, fieldKey: '(entire section)', oldValue: null, newValue: current });
        continue;
      }
      for (const key of new Set([...Object.keys(current), ...Object.keys(original)])) {
        if (!isEqual(current[key], original[key])) {
          changes.push({
            sectionId,
            sectionLabel: SECTION_LABELS[sectionId] || sectionId,
            fieldKey: key,
            oldValue: original[key],
            newValue: current[key],
          });
        }
      }
    }

    if (!isEqual(theme, savedSnapshot.theme)) {
      for (const key of Object.keys(theme)) {
        const k = key as keyof ThemeSettings;
        if (!isEqual(theme[k], savedSnapshot.theme[k])) {
          changes.push({
            sectionId: 'theme',
            sectionLabel: 'Look & Feel',
            fieldKey: key,
            oldValue: savedSnapshot.theme[k],
            newValue: theme[k],
          });
        }
      }
    }

    return changes;
  }, [sections, theme, savedSnapshot, isEqual]);

  const saveAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Save to backend if authenticated and token exists
      const token = localStorage.getItem('reframe-token');
      if (token && isAuthenticated) {
        // Save all sections
        for (const [sectionId, content] of Object.entries(sections)) {
          try {
            await sectionsAPI.save(sectionId, SECTION_LABELS[sectionId] || sectionId, content);
          } catch (err) {
            console.warn(`Failed to save section ${sectionId} to backend:`, err);
          }
        }

        // Save theme
        try {
          await themeAPI.update({
            fontHeading: theme.fonts.heading,
            fontBody: theme.fonts.body,
            fontMono: theme.fonts.mono,
            brand: theme.colors.brand,
            brandHover: theme.colors.brandHover,
            surface: theme.colors.surface,
            onyx: theme.colors.onyx,
            categoryFoundation: theme.colors.categoryFoundation,
            categoryEnhancement: theme.colors.categoryEnhancement,
            categoryRetouch: theme.colors.categoryRetouch,
            categoryAdvanced: theme.colors.categoryAdvanced,
            ambientOrb: theme.colors.ambientOrb,
            chatBubbles: theme.colors.chatBubbles,
            footerDark: theme.colors.footerDark,
            accentLavender: theme.colors.accentLavender,
            baseFontSize: theme.typography.baseFontSize,
            headingScale: theme.typography.headingScale,
            lineHeight: theme.typography.lineHeight,
            letterSpacing: theme.typography.letterSpacing,
            radiusSm: theme.radius.sm,
            radiusMd: theme.radius.md,
            radiusLg: theme.radius.lg,
            radiusXl: theme.radius.xl,
          });
        } catch (err) {
          console.warn('Failed to save theme to backend:', err);
        }
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('reframe-content', JSON.stringify(sections));
      localStorage.setItem('reframe-theme', JSON.stringify(theme));
      applyTheme(theme);
      
      setSavedSnapshot({
        sections: JSON.parse(JSON.stringify(sections)),
        theme: JSON.parse(JSON.stringify(theme)),
      });
      setIsDirty(false);
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  }, [sections, theme, isAuthenticated]);

  const discardChanges = useCallback(() => {
    setSections(savedSnapshot.sections);
    setThemeState(savedSnapshot.theme);
    applyTheme(savedSnapshot.theme);
    setIsDirty(false);
  }, [savedSnapshot]);

  return (
    <ContentContext.Provider
      value={{
        sections,
        theme,
        isAuthenticated,
        currentUser,
        isUserAuthenticated,
        isAuthChecking,
        getSectionContent,
        setSectionContent,
        resetSection,
        setTheme,
        resetTheme,
        logout,
        signup,
        userLogin,
        googleLogin,
        userLogout,
        forgotPassword,
        resetPassword,
        setCurrentUser,
        registeredSections,
        allDefaults: ALL_SECTION_DEFAULTS,
        hasUnsavedChanges,
        getChangedFields,
        saveAll,
        discardChanges,
        savedSnapshot,
        isLoading,
        error,
        syncWithBackend,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};


