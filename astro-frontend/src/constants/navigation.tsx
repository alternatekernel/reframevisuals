import { 
  MessageSquare, FolderOpen, RotateCcw, Image, CreditCard,
  Briefcase, Layers, ShieldCheck, Eye, Inbox, Target, 
  UserCheck, BarChart3, FileText, Users as UsersIcon, Settings2,
  Headset
} from 'lucide-react';
import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  path: string;
}

export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Chat', icon: Headset, path: '/dashboard?view=chat' },
  { id: 'jobs', label: 'Active Projects', icon: FolderOpen, path: '/dashboard' },
  { id: 'orders', label: 'Order History', icon: RotateCcw, path: '/dashboard/orders' },
  { id: 'gallery', label: 'Gallery', icon: Image, path: '/dashboard/gallery' },
  { id: 'billing', label: 'Billing & Invoices', icon: CreditCard, path: '/dashboard/billing' },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'chats', label: 'Chats', icon: MessageSquare, path: '/admin/support' },
  { id: 'stageboard', label: 'Stageboard', icon: Briefcase, path: '/admin' },
  { id: 'production', label: 'Production', icon: Layers, path: '/admin/production' },
  { id: 'quality-control', label: 'Quality Control', icon: ShieldCheck, path: '/admin/quality' },
  { id: 'watchlist', label: 'Watchlist', icon: Eye, path: '/admin/watchlist' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/admin/support' },
  { id: 'leads', label: 'Leads', icon: Target, path: '/admin/leads' },
  { id: 'customers', label: 'Customers', icon: UserCheck, path: '/admin/customers' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  { id: 'team', label: 'Team', icon: UsersIcon, path: '/admin/team' },
  { id: 'integrations', label: 'Integrations', icon: Settings2, path: '/admin/integrations' },
];
