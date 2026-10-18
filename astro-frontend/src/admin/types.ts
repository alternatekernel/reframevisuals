export interface ThemeSettings {
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  colors: {
    brand: string;
    brandHover: string;
    surface: string;
    onyx: string;
    categoryFoundation: string;
    categoryEnhancement: string;
    categoryRetouch: string;
    categoryAdvanced: string;
    ambientOrb: string;
    chatBubbles: string;
    footerDark: string;
    accentLavender: string;
  };
  typography: {
    baseFontSize: number;
    headingScale: number;
    lineHeight: number;
    letterSpacing: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export const DEFAULT_THEME: ThemeSettings = {
  fonts: {
    heading: 'Google Sans',
    body: 'Google Sans',
    mono: 'JetBrains Mono',
  },
  colors: {
    brand: '#E97451',
    brandHover: '#D4643E',
    surface: '#FFFFFF',
    onyx: '#1A1A1A',
    categoryFoundation: '#F0EBE3',
    categoryEnhancement: '#E8EDF5',
    categoryRetouch: '#EDE8F5',
    categoryAdvanced: '#E8F5EE',
    ambientOrb: '#E97451',
    chatBubbles: '#E97451',
    footerDark: '#111111',
    accentLavender: '#8B7CF6',
  },
  typography: {
    baseFontSize: 16,
    headingScale: 1.25,
    lineHeight: 1.6,
    letterSpacing: -0.02,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
  },
};

export interface AdminSectionMeta {
  id: string;
  label: string;
  description?: string;
  parentPage?: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'color' | 'toggle' | 'list' | 'url' | 'image' | 'select';
    options?: { label: string; value: any }[];
  }[];
  defaultContent: any;
}

export interface SectionContent {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content: any;
  order: number;
  isActive: boolean;
}
