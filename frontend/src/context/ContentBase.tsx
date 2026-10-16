import React, { createContext, useContext } from 'react';
import { ThemeSettings, AdminSectionMeta } from '../admin/types';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  customerCode?: string;
  isGuest?: boolean;
  onboardingCompleted?: boolean;
  role?: string;
  companyName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  industry?: string | null;
  avatarUrl?: string | null;
}

export interface ChangedField {
  sectionId: string;
  sectionLabel: string;
  fieldKey: string;
  oldValue: any;
  newValue: any;
}

export interface ContentContextType {
  sections: Record<string, Record<string, any>>;
  theme: ThemeSettings;
  isAuthenticated: boolean;
  currentUser: User | null;
  isUserAuthenticated: boolean;
  isAuthChecking: boolean;
  getSectionContent: (id: string) => Record<string, any>;
  setSectionContent: (id: string, content: Record<string, any>) => void;
  resetSection: (id: string) => void;
  setTheme: (theme: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  logout: () => void;
  // Improved types for better error handling in UI
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  userLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (credential: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  userLogout: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  registeredSections: AdminSectionMeta[];
  allDefaults: Record<string, Record<string, any>>;
  hasUnsavedChanges: boolean;
  getChangedFields: () => ChangedField[];
  saveAll: () => Promise<void>;
  discardChanges: () => void;
  savedSnapshot: { sections: Record<string, Record<string, any>>; theme: ThemeSettings };
  isLoading: boolean;
  error: string | null;
  syncWithBackend: () => Promise<void>;
}

export const ContentContext = createContext<ContentContextType | null>(null);

export function useContent(): ContentContextType {
  const context = useContext(ContentContext);
  if (!context) {
    console.error('useContent: Context is null! Parent tree might be broken.');
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
