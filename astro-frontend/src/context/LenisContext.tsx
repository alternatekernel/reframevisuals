import React, { createContext, useContext } from 'react';
import type Lenis from 'lenis';
import { useLenis } from '../hooks/useLenis';

type LenisRef = React.MutableRefObject<Lenis | null>;

const LenisContext = createContext<LenisRef | null>(null);

export const LenisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useLenis();
  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
};

export const useLenisRef = () => useContext(LenisContext);
