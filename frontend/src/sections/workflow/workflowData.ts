import type React from 'react';
import { Upload, ScanSearch, Wand2, ShieldCheck } from 'lucide-react';

// ─── Node definitions ────────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  label: string;
  sublabel: string;
  icons: React.ElementType[];
  color: string;        // border / accent
  bg: string;           // card background
  iconColor: string;
}

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'upload',
    label: 'Upload',
    sublabel: 'Files',
    icons: [Upload],
    color: '#3B82F6',
    bg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    id: 'review',
    label: 'Review',
    sublabel: 'Admin Estimation',
    icons: [ScanSearch],
    color: '#C2410C',
    bg: '#FFF4F0',
    iconColor: '#C2410C',
  },
  {
    id: 'retouch',
    label: 'Editing',
    sublabel: 'Expert Production',
    icons: [Wand2],
    color: '#8B5CF6',
    bg: '#F5F3FF',
    iconColor: '#8B5CF6',
  },
  {
    id: 'qa',
    label: 'QA Gate',
    sublabel: 'Quality Control',
    icons: [ShieldCheck],
    color: '#047857',
    bg: '#ECFDF5',
    iconColor: '#047857',
  },
];

export const WORKFLOW_INTEGRATIONS = [
  'Amazon',
  'Google Drive',
  'Dropbox',
  'WeTransfer',
  'App Sync',
  'Direct Connect',
];

export const WORKFLOW_STEP_DESCRIPTIONS = [
  'Drop files, share a link, or connect your cloud storage.',
  'We review your files and send a quote in 15–30 minutes.',
  'Our production team edits every image to your brief.',
  'Two QA checks before delivery. Approve or request revisions.',
];
