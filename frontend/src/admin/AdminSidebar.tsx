import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ClipboardList, Users, UserRound, FileText, Image, FileStack, Link2, Shield, BarChart2, Eye } from 'lucide-react';

import { usePlatformNavigation } from '../hooks/usePlatformNavigation';
import { useAuthProfile } from './hooks/useAdminData';

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, mobileOpen = false, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: navItems, isLoading } = usePlatformNavigation(true);
  const { data: profile } = useAuthProfile();

  const isActive = (path: string) =>
    path === '/admin'
      ? currentPath === '/admin'
      : currentPath === path || currentPath.startsWith(path + '/');

  const extraNavItems = [
    {
      id: 'cms-blog',
      label: 'Blog',
      path: '/admin/blog',
      section: 'Content',
      icon: FileText,
    },
    {
      id: 'cms-pages',
      label: 'Pages',
      path: '/admin/pages',
      section: 'Content',
      icon: FileStack,
    },
    {
      id: 'cms-media',
      label: 'Media Library',
      path: '/admin/media',
      section: 'Content',
      icon: Image,
    },
    {
      id: 'cms-permalinks',
      label: 'Permalinks',
      path: '/admin/permalinks',
      section: 'Content',
      icon: Link2,
    },
    {
      id: 'admin-staff',
      label: 'Staff Users',
      path: '/admin/users',
      section: 'People',
      icon: Users,
    },
    {
      id: 'admin-customers',
      label: 'Customers',
      path: '/admin/customers',
      section: 'People',
      icon: Building2,
    },
    {
      id: 'admin-roles',
      label: 'Roles',
      path: '/admin/roles',
      section: 'People',
      icon: Shield,
    },
    {
      id: 'admin-profile',
      label: 'My Profile',
      path: '/admin/profile',
      section: 'People',
      icon: UserRound,
    },
    {
      id: 'admin-audit',
      label: 'Audit Log',
      path: '/admin/audit',
      section: 'Settings',
      icon: ClipboardList,
    },
    {
      id: 'admin-analytics',
      label: 'Analytics',
      path: '/admin/analytics',
      section: 'System',
      icon: BarChart2,
    },
    {
      id: 'admin-visitor-analytics',
      label: 'Visitors',
      path: '/admin/visitor-analytics',
      section: 'System',
      icon: Eye,
    },
  ];

  // Deduplicate: extra items take precedence over platform nav items for the same path
  const mergedNavItems = navItems
    ? [...navItems.filter((i: any) => !extraNavItems.some(e => e.path === i.path)), ...extraNavItems]
    : extraNavItems;

  // Group items by section
  const sections = mergedNavItems.reduce((acc: any[], item: any) => {
    let section = acc.find(s => s.label === item.section);
    if (!section) {
      section = { label: item.section, items: [] };
      acc.push(section);
    }
    section.items.push(item);
    return acc;
  }, []);

  return (
    <aside className={`an-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'show' : ''}`}>
      {/* Brand */}
      <div className="an-brand group" onClick={() => { navigate('/admin'); onNavigate?.(); }} style={{ cursor: 'pointer' }}>
        <img src="/logo.svg" alt="Reframe" className="w-8 h-8 object-contain mr-3" />
        <div className="flex flex-col">
          <div className="an-brand-name">Reframe</div>
          <div className="text-xs font-medium tracking-[0.2em] leading-none overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-50 group-hover:mt-1" style={{ fontFamily: 'var(--font-heading)' }}>VISUALS</div>
        </div>
        {!mobileOpen && !collapsed && <span className="an-brand-badge">Admin</span>}
        {mobileOpen && (
          <button
            className="an-sidebar-close-btn"
            onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="an-nav">
        {isLoading ? (
          <div className="p-4 text-white/30 text-xs animate-pulse">Loading navigation...</div>
        ) : (
          sections.map((section: any, si: number) => (
            <div key={si}>
              {si > 0 && <div className="an-nav-divider" />}
              <div className="an-nav-section">
                {!collapsed && <div className="an-nav-section-label">{section.label}</div>}
                {section.items.map((item: any) => (
                  <button
                    key={item.id}
                    className={`an-nav-item${isActive(item.path) ? ' active' : ''}`}
                    onClick={() => { navigate(item.path); onNavigate?.(); }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="ni-icon">
                      {React.createElement(item.icon, { size: 18, strokeWidth: 2 })}
                    </span>
                    {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* User Footer */}
      {!collapsed && (
        <div className="an-nav-user" onClick={() => { navigate('/admin/profile'); onNavigate?.(); }} style={{ cursor: 'pointer' }}>
          <div className="an-avatar">
            {profile?.firstName?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="an-user-name">
              {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Administrator'}
            </div>
            <div className="an-user-role">{profile?.role || 'Staff Member'}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
