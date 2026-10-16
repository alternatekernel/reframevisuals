// Admin Dashboard Custom Hooks
// React Query hooks for data fetching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/adminApi';
import { adminFetch } from '../utils/api';

// ─────────────────────────────────────────────────────────────
// Auth Hooks
// ─────────────────────────────────────────────────────────────

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.auth.login,
    onSuccess: (response) => {
      if (response.data) {
        // The backend returns { success, data: { user, token } } while fetchApi wraps
        // the whole JSON response under response.data. Older UI code expected the
        // token at response.data.token, which saved "undefined" and immediately
        // sent users back to /admin/login after a successful sign-in.
        const loginData = (response.data as any)?.data ?? response.data;
        const token = loginData?.token;
        const user = loginData?.user;

        if (token && token !== 'null' && token !== 'undefined') {
          localStorage.setItem('admin_token', token);
          if (user) {
            localStorage.setItem('admin_user', JSON.stringify(user));
          }
          // Clear old cached auth state so AdminLayout refetches with the new token.
          queryClient.removeQueries({ queryKey: ['auth', 'profile'] });
          queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
        }
      }
    },
  });
};

export const useAuthProfile = () => {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      if (!token || token === 'null' || token === 'undefined') {
        throw new Error('No admin token found');
      }
      const response = await adminApi.auth.getProfile();
      if (response.error) throw new Error(response.error.message);
      // Backend returns { success: true, data: { ...user } }, fetchApi wraps as { data: ... }
      // so response.data is the full { success, data } object
      const userData = (response.data as any)?.data ?? response.data;
      return userData;
    },
    enabled: typeof window !== 'undefined' && 
      !!localStorage.getItem('admin_token') && 
      localStorage.getItem('admin_token') !== 'null' && 
      localStorage.getItem('admin_token') !== 'undefined',
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// ─────────────────────────────────────────────────────────────
// Metrics Hooks
// ─────────────────────────────────────────────────────────────

export const useHeroMetrics = () => {
  return useQuery({
    queryKey: ['metrics', 'hero'],
    queryFn: async () => {
      const response = await adminApi.metrics.getHero();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// ─────────────────────────────────────────────────────────────
// Orders & Kanban Hooks
// ─────────────────────────────────────────────────────────────

const KANBAN_STATUSES = [
  { id: 'new_review',         key: 'new_review' },
  { id: 'awaiting_approval',  key: 'awaiting_approval' },
  { id: 'inProgress',         key: 'in_progress' },
  { id: 'readyQC',            key: 'ready_qc' },
  { id: 'completed',          key: 'completed' },
  { id: 'revision_needed',    key: 'revision_needed' },
];

function normalizeKanban(data: any) {
  if (!data) return [];
  return KANBAN_STATUSES.map(({ id, key }) => {
    const col = data[id] || { id, title: key.replace('_', ' '), cards: [] };
    const status = key;
    return {
      status,
      label: col.title || key,
      orders: (col.cards || []).map((card: any) => ({
        id: card.id,
        orderNumber: card.code,
        customerName: card.customer,
        customerEmail: card.customerEmail || '',
        projectName: card.title || card.code || '—',
        status,
        priority: card.priority,
        totalImages: card.volume,
        completedImages: status === 'completed' ? card.volume : 0,
        expectedCompletion: card.expectedCompletion,
        createdAt: card.createdAt,
        assignedEditorId: card.assignedEditorId || null,
        thumbnail: card.thumbnail || null,
        columnPosition: card.columnPosition ?? 0,
      })),
    };
  });
}

export const useKanban = (archived = false) => {
  return useQuery({
    queryKey: ['kanban', archived],
    queryFn: async () => {
      const response = await adminApi.orders.getKanban(archived);
      if (response.error) throw new Error(response.error.message);
      return normalizeKanban(response.data);
    },
    refetchInterval: 15000,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await adminApi.orders.getOrder(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.orders.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateImageStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, status }: { imageId: string; status: string }) =>
      adminApi.orders.updateImageStatus(imageId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.orders.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOrderActivities = (orderId: string | null) => {
  return useQuery({
    queryKey: ['activities', orderId],
    queryFn: async () => {
      const response = await adminApi.orders.getActivities(orderId!);
      if ((response as any).error) throw new Error((response as any).error.message);
      return (response as any).data ?? [];
    },
    enabled: !!orderId,
    refetchInterval: 15000,
  });
};

export const useAddOrderActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, message }: { orderId: string; message: string }) =>
      adminApi.orders.addActivity(orderId, message),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activities', vars.orderId] });
    },
  });
};

export const useUpdateOrderPosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, position }: { id: string; position: number }) =>
      adminApi.orders.updatePosition(id, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
};

export const useArchiveOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.orders.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
};

export const useUnarchiveOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.orders.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Editors Hooks
// ─────────────────────────────────────────────────────────────

export const useEditors = () => {
  return useQuery({
    queryKey: ['editors'],
    queryFn: async () => {
      const response = await adminApi.editors.getAll();
      if (response.error) throw new Error(response.error.message);
      return (response.data as any)?.editors || response.data || [];
    },
  });
};

export const useEditor = (id: string) => {
  return useQuery({
    queryKey: ['editors', id],
    queryFn: async () => {
      const response = await adminApi.editors.getById(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateEditor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.editors.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
    },
  });
};

export const useCreateEditor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.editors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
    },
  });
};

export const useDeleteEditor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.editors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Quotations Hooks
// ─────────────────────────────────────────────────────────────

export const useQuotations = () => {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const response = await adminApi.quotations.getAll();
      if (response.error) throw new Error(response.error.message);
      return (response.data as any)?.quotations || response.data || [];
    },
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.quotations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};

export const useConvertQuotationToOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.quotations.convertToOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Finance Hooks
// ─────────────────────────────────────────────────────────────

export const useFinanceDashboard = () => {
  return useQuery({
    queryKey: ['finance', 'dashboard'],
    queryFn: async () => {
      const response = await adminApi.finance.getDashboard();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['finance', 'invoices'],
    queryFn: async () => {
      const response = await adminApi.finance.getInvoices();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Tasks Hooks
// ─────────────────────────────────────────────────────────────

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await adminApi.tasks.getAll();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Support Hooks
// ─────────────────────────────────────────────────────────────

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: async () => {
      const response = await adminApi.support.getTickets();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.support.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.support.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Leads Hooks
// ─────────────────────────────────────────────────────────────

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await adminApi.leads.getAll();
      if (response.error) throw new Error(response.error.message);
      return (response.data as any)?.leads || response.data || [];
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Assets Hooks
// ─────────────────────────────────────────────────────────────

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await adminApi.assets.getAll();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
  });
};

export const useUploadAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => adminApi.assets.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Theme Hooks
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// Alerts Hooks
// ─────────────────────────────────────────────────────────────

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await adminApi.alerts.getAll();
      if (response.error) throw new Error(response.error.message);
      // Backend returns { alerts: [], totalCount: ..., unreadCount: ... }
      return (response.data as any)?.alerts || [];
    },
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.alerts.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Pricing Hooks
// ─────────────────────────────────────────────────────────────

export const useCustomerTiers = () => {
  return useQuery({
    queryKey: ['pricing', 'customer-tiers'],
    queryFn: async () => {
      const response = await adminApi.pricing.getCustomerTiers();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useEditorTiers = () => {
  return useQuery({
    queryKey: ['pricing', 'editor-tiers'],
    queryFn: async () => {
      const response = await adminApi.pricing.getEditorTiers();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Payouts Hooks
// ─────────────────────────────────────────────────────────────

export const usePayoutBatches = () => {
  return useQuery({
    queryKey: ['payouts', 'batches'],
    queryFn: async () => {
      const response = await adminApi.payouts.getBatches();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useApprovePayoutBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.payouts.approveBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts', 'batches'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Business Operations Hooks
// ─────────────────────────────────────────────────────────────

export const useAttendance = () => {
  return useQuery({
    queryKey: ['business', 'attendance'],
    queryFn: async () => {
      const response = await adminApi.business.getAttendance();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const usePayroll = () => {
  return useQuery({
    queryKey: ['business', 'payroll'],
    queryFn: async () => {
      const response = await adminApi.business.getPayroll();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const usePartners = () => {
  return useQuery({
    queryKey: ['business', 'partners'],
    queryFn: async () => {
      const response = await adminApi.business.getPartners();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useChatbotConfig = () => {
  return useQuery({
    queryKey: ['business', 'chatbot'],
    queryFn: async () => {
      const response = await adminApi.business.getChatbotConfig();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useUpdateChatbotConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.business.updateChatbotConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'chatbot'] });
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Operations Hooks
// ─────────────────────────────────────────────────────────────

export const useTeam = () => {
  return useQuery({
    queryKey: ['operations', 'team'],
    queryFn: async () => {
      const response = await adminApi.operations.getTeam();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.operations.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'team'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.operations.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'team'] });
    },
  });
};

export const useNDA = () => {
  return useQuery({
    queryKey: ['operations', 'nda'],
    queryFn: async () => {
      const response = await adminApi.operations.getNDA();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useCreateNDA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.operations.createNDA(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'nda'] });
    },
  });
};

export const useStyleGuide = () => {
  return useQuery({
    queryKey: ['operations', 'styleguide'],
    queryFn: async () => {
      const response = await adminApi.operations.getStyleGuide();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

export const useUpdateStyleGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.operations.updateStyleGuide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'styleguide'] });
    },
  });
};

export const useWatchlist = () => {
  return useQuery({
    queryKey: ['operations', 'watchlist'],
    queryFn: async () => {
      const response = await adminApi.operations.getWatchlist();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Customers Hooks
// ─────────────────────────────────────────────────────────────

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await adminApi.customers.getAll();
      if (response.error) throw new Error(response.error.message);
      return (response.data as any)?.customers || [];
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Search Hook
// ─────────────────────────────────────────────────────────────

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await adminApi.search.search(query);
      if (response.error) throw new Error(response.error.message);
      return (response.data as any)?.results || response.data || [];
    },
    enabled: query.length > 2,
  });
};

// ─────────────────────────────────────────────────────────────
// User Management Hooks
// ─────────────────────────────────────────────────────────────

export const useUsers = () => useQuery({
  queryKey: ['admin', 'users'],
  queryFn: async () => adminFetch('/users'),
});

export const useInviteUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => adminFetch('/users/invite', { method: 'POST', body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: any) => adminFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminFetch(`/users/${id}/deactivate`, { method: 'PATCH' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
};

export const useResetUserPassword = () => {
  return useMutation({ mutationFn: (id: string) => adminFetch(`/users/${id}/reset-password`, { method: 'POST' }) });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminFetch(`/users/${id}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
};
