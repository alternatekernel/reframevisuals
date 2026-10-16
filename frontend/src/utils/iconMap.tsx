import { 
  FolderOpen, RotateCcw, Image, CreditCard, User, 
  Headset, Briefcase, Settings, MessageSquare, Layers, 
  ShieldCheck, Eye, Inbox, Target, UserCheck, BarChart3, 
  FileText, Users, Settings2, HelpCircle, LayoutGrid,
  Bot, Calendar, Puzzle, Copy, FilePlus, Globe, Zap,
  Mail, Handshake, GitMerge
} from 'lucide-react';
import React from 'react';

export const IconMap: Record<string, React.FC<any>> = {
  FolderOpen,
  RotateCcw,
  Image,
  CreditCard,
  User,
  Headset,
  Briefcase,
  Settings,
  MessageSquare,
  Layers,
  ShieldCheck,
  Eye,
  Inbox,
  Target,
  UserCheck,
  BarChart3,
  FileText,
  Users,
  Settings2,
  HelpCircle,
  LayoutGrid,
  Bot,
  Calendar,
  Puzzle,
  Copy,
  FilePlus,
  Globe,
  Zap,
  Mail,
  Handshake,
  GitMerge
};

export const getIcon = (name: string | null) => {
  if (!name) return HelpCircle;
  return IconMap[name] || HelpCircle;
};
