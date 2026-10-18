import '../shims/storage';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ContentProvider } from '../context/ContentContext';
import { ModalProvider } from '../context/ModalContext';
import { ServicesProvider } from '../context/ServicesContext';

// Astro islands are separate React roots, so context does not cross between them.
// Every island that needs shared context is wrapped with withProviders(); the
// QueryClient is a module singleton so the cache is shared across islands.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } } });
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ContentProvider>
          <ModalProvider>
            <ServicesProvider>
              {children}
            </ServicesProvider>
          </ModalProvider>
        </ContentProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export function withProviders<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => (
    <Providers>
      <Component {...props} />
    </Providers>
  );
  Wrapped.displayName = `withProviders(${Component.displayName || Component.name || 'Island'})`;
  return Wrapped;
}
