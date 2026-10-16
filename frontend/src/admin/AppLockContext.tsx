import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AppLockContextValue = {
  locked: boolean;
  unlock: () => void;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const SESSION_KEY = 'admin_session_locked';

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise from sessionStorage so refresh doesn't auto-unlock
  const [locked, setLocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');

  const lockNow = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setLocked(true);
  }, []);

  const unlock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setLocked(false);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setLocked(true);
      }, LOCK_TIMEOUT_MS);
    };
    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, []);

  const value = useMemo(() => ({ locked, unlock, lockNow }), [locked, unlock, lockNow]);
  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
};

export const useAppLock = () => {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
};

export const PIN_HASH_KEY = 'admin_lock_pin_hash';

export const hashPin = async (pin: string): Promise<string> => {
  const data = new TextEncoder().encode(pin);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};
