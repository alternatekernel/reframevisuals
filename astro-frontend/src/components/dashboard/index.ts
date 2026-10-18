export { default as DashboardLayout } from './DashboardLayout';
export { default as Sidebar } from './Sidebar';
export { default as JobsListView } from './JobsListView';
export { default as JobDetailsView } from './JobDetailsView';
export { default as OrderHistoryView } from './OrderHistoryView';
export { default as BillingView } from './BillingView';
export { default as AccountView } from './AccountView';
export { default as ChatView } from './ChatView';
export { default as OrderFlowView } from './OrderFlowView';
export { default as GalleryView } from './GalleryView';
export { UsageWidget, ActivityFeed } from './StatsWidgets';

export { DashboardProvider, useDashboard } from '../../context/DashboardContext';
export type { Job, JobImage, JobStatus, ViewType, DashboardStats } from '../../types/dashboard';