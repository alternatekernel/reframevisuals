import { useQuery } from '@tanstack/react-query';
import { fetchPlatformPages } from '../services/platformService';
import { getIcon } from '../utils/iconMap';

export const usePlatformNavigation = (isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ['platform-pages', isAdmin],
    queryFn: async () => {
      let mappedPages: any[] = [];
      
      try {
        const allPages = await fetchPlatformPages();
        if (Array.isArray(allPages)) {
          mappedPages = allPages
            .filter(page => page && page.isAdmin === isAdmin)
            .map(page => ({
              id: page.id || page.path?.split('/').pop() || 'home',
              label: page.title || 'Untitled Page',
              icon: getIcon(page.icon),
              path: page.path || '/admin',
              section: page.section || 'Other'
            }));
        }
      } catch (error) {
        console.warn('Failed to fetch dynamic platform pages, using fallbacks.', error);
      }
        
      // Ensure Admin always has core routes regardless of API status
      if (isAdmin) {
        const adminFallbacks = [
          {
            id: 'chats',
            label: 'Customer Chats',
            icon: getIcon('MessageSquare'),
            path: '/admin/chats',
            section: 'Main'
          },
          {
            id: 'custom-order',
            label: 'Custom Order',
            icon: getIcon('PlusCircle'),
            path: '/admin/custom-order',
            section: 'Main'
          },
          {
            id: 'production',
            label: 'Production',
            icon: getIcon('Layers'),
            path: '/admin/production',
            section: 'Operations'
          },
          {
            id: 'leads',
            label: 'Leads & CRM',
            icon: getIcon('Users'),
            path: '/admin/leads',
            section: 'Business'
          },
          {
            id: 'support-hub',
            label: 'Support Hub',
            icon: getIcon('LifeBuoy'),
            path: '/admin/support',
            section: 'Main'
          },
          {
            id: 'platform',
            label: 'Platform',
            icon: getIcon('Settings'),
            path: '/admin/platform',
            section: 'System'
          }
        ];

        // Merge and avoid duplicates by path
        adminFallbacks.forEach(fallback => {
          if (!mappedPages.some(p => p.path === fallback.path)) {
            mappedPages.push(fallback);
          }
        });

        // Force primary admin order for consistent sidebar placement.
        const preferredOrder = [
          '/admin/chats',
          '/admin/support',
          '/admin/custom-order',
          '/admin/production',
          '/admin/leads',
          '/admin/platform',
        ];
        mappedPages.sort((a, b) => {
          const ai = preferredOrder.indexOf(a.path);
          const bi = preferredOrder.indexOf(b.path);
          const aScore = ai === -1 ? 999 : ai;
          const bScore = bi === -1 ? 999 : bi;
          if (aScore !== bScore) return aScore - bScore;
          return String(a.label).localeCompare(String(b.label));
        });
      }
      
      // If still empty and isAdmin, at least provide one item to avoid crash
      if (isAdmin && mappedPages.length === 0) {
        mappedPages.push({
          id: 'dashboard',
          label: 'Dashboard',
          icon: getIcon('LayoutGrid'),
          path: '/admin',
          section: 'Main'
        });
        mappedPages.push({
          id: 'custom-order',
          label: 'Custom Order',
          icon: getIcon('PlusCircle'),
          path: '/admin/custom-order',
          section: 'Main'
        });
      }
      
      return mappedPages;
    },
    staleTime: 1000 * 60 * 5,
  });
};
