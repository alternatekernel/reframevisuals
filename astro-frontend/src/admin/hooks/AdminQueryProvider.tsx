import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a React Query client with admin-specific settings
const createAdminQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
};

interface AdminQueryProviderProps {
  children: React.ReactNode;
}

export const AdminQueryProvider: React.FC<AdminQueryProviderProps> = ({ children }) => {
  const [queryClient] = React.useState(() => createAdminQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
