/**
 * Theme System for Adiology Dashboard
 * Provides multiple color schemes that users can select
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryGradient: string;
    
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    secondaryGradient: string;
    
    accent: string;
    accentLight: string;
    accentDark: string;
    
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    
    border: string;
    borderLight: string;
    
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  hex: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    accentLight: string;
    gradientFrom: string;
    gradientTo: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarHover: string;
  };
}

export const themes: Record<string, Theme> = {
  purple: {
    id: 'purple',
    name: 'Purple Elegance',
    description: 'Classic purple and indigo combination - Professional and modern',
    colors: {
      primary: 'indigo-600',
      primaryLight: 'indigo-50',
      primaryDark: 'indigo-700',
      primaryGradient: 'from-indigo-500 to-purple-600',
      
      secondary: 'purple-600',
      secondaryLight: 'purple-50',
      secondaryDark: 'purple-700',
      secondaryGradient: 'from-purple-500 to-pink-600',
      
      accent: 'pink-600',
      accentLight: 'pink-50',
      accentDark: 'pink-700',
      
      bgPrimary: 'slate-50',
      bgSecondary: 'white',
      bgCard: 'white/60',
      
      textPrimary: 'slate-900',
      textSecondary: 'slate-600',
      textMuted: 'slate-400',
      
      border: 'slate-200',
      borderLight: 'slate-100',
      
      success: 'green-600',
      warning: 'amber-600',
      error: 'red-600',
      info: 'blue-600',
    },
    hex: {
      primary: '#4f46e5',
      primaryLight: '#eef2ff',
      primaryDark: '#4338ca',
      secondary: '#9333ea',
      secondaryLight: '#faf5ff',
      accent: '#db2777',
      accentLight: '#fdf2f8',
      gradientFrom: '#6366f1',
      gradientTo: '#9333ea',
      sidebarBg: '#4f46e5',
      sidebarText: '#ffffff',
      sidebarHover: '#4338ca',
    },
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calming blue and cyan tones - Fresh and trustworthy',
    colors: {
      primary: 'blue-600',
      primaryLight: 'blue-50',
      primaryDark: 'blue-700',
      primaryGradient: 'from-blue-500 to-cyan-600',
      
      secondary: 'cyan-600',
      secondaryLight: 'cyan-50',
      secondaryDark: 'cyan-700',
      secondaryGradient: 'from-cyan-500 to-teal-600',
      
      accent: 'teal-600',
      accentLight: 'teal-50',
      accentDark: 'teal-700',
      
      bgPrimary: 'blue-50',
      bgSecondary: 'white',
      bgCard: 'white/60',
      
      textPrimary: 'slate-900',
      textSecondary: 'slate-600',
      textMuted: 'slate-400',
      
      border: 'blue-200',
      borderLight: 'blue-100',
      
      success: 'emerald-600',
      warning: 'orange-600',
      error: 'rose-600',
      info: 'sky-600',
    },
    hex: {
      primary: '#2563eb',
      primaryLight: '#eff6ff',
      primaryDark: '#1d4ed8',
      secondary: '#0891b2',
      secondaryLight: '#ecfeff',
      accent: '#0d9488',
      accentLight: '#f0fdfa',
      gradientFrom: '#3b82f6',
      gradientTo: '#0891b2',
      sidebarBg: '#2563eb',
      sidebarText: '#ffffff',
      sidebarHover: '#1d4ed8',
    },
  },

  forest: {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural green and emerald shades - Growth and harmony',
    colors: {
      primary: 'emerald-600',
      primaryLight: 'emerald-50',
      primaryDark: 'emerald-700',
      primaryGradient: 'from-emerald-500 to-green-600',
      
      secondary: 'green-600',
      secondaryLight: 'green-50',
      secondaryDark: 'green-700',
      secondaryGradient: 'from-green-500 to-lime-600',
      
      accent: 'lime-600',
      accentLight: 'lime-50',
      accentDark: 'lime-700',
      
      bgPrimary: 'emerald-50',
      bgSecondary: 'white',
      bgCard: 'white/60',
      
      textPrimary: 'slate-900',
      textSecondary: 'slate-600',
      textMuted: 'slate-400',
      
      border: 'emerald-200',
      borderLight: 'emerald-100',
      
      success: 'green-600',
      warning: 'amber-600',
      error: 'red-600',
      info: 'teal-600',
    },
    hex: {
      primary: '#059669',
      primaryLight: '#ecfdf5',
      primaryDark: '#047857',
      secondary: '#16a34a',
      secondaryLight: '#f0fdf4',
      accent: '#65a30d',
      accentLight: '#f7fee7',
      gradientFrom: '#10b981',
      gradientTo: '#16a34a',
      sidebarBg: '#059669',
      sidebarText: '#ffffff',
      sidebarHover: '#047857',
    },
  },
};

export const defaultTheme = themes.purple;

export function getStoredTheme(): Theme {
  try {
    const storedThemeId = localStorage.getItem('adiology-theme');
    if (storedThemeId && themes[storedThemeId]) {
      return themes[storedThemeId];
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage:', e);
  }
  return defaultTheme;
}

export function saveTheme(themeId: string): void {
  try {
    localStorage.setItem('adiology-theme', themeId);
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
}

export function getThemeClasses(theme: Theme) {
  return {
    primaryGradient: `bg-gradient-to-r ${theme.colors.primaryGradient}`,
    secondaryGradient: `bg-gradient-to-r ${theme.colors.secondaryGradient}`,
    
    bgPrimary: `bg-${theme.colors.bgPrimary}`,
    bgSecondary: `bg-${theme.colors.bgSecondary}`,
    bgCard: `bg-${theme.colors.bgCard}`,
    
    textPrimary: `text-${theme.colors.textPrimary}`,
    textSecondary: `text-${theme.colors.textSecondary}`,
    textMuted: `text-${theme.colors.textMuted}`,
    
    border: `border-${theme.colors.border}`,
    borderLight: `border-${theme.colors.borderLight}`,
    
    primary: `text-${theme.colors.primary}`,
    primaryBg: `bg-${theme.colors.primary}`,
    primaryBgLight: `bg-${theme.colors.primaryLight}`,
    primaryBorder: `border-${theme.colors.primary}`,
    
    secondary: `text-${theme.colors.secondary}`,
    secondaryBg: `bg-${theme.colors.secondary}`,
    secondaryBgLight: `bg-${theme.colors.secondaryLight}`,
    secondaryBorder: `border-${theme.colors.secondary}`,
    
    success: `text-${theme.colors.success}`,
    warning: `text-${theme.colors.warning}`,
    error: `text-${theme.colors.error}`,
    info: `text-${theme.colors.info}`,
  };
}

export function applyThemeToDOM(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme.id);
  
  document.documentElement.classList.remove('theme-purple', 'theme-ocean', 'theme-forest');
  document.documentElement.classList.add(`theme-${theme.id}`);
  
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.hex.primary);
  root.style.setProperty('--theme-primary-light', theme.hex.primaryLight);
  root.style.setProperty('--theme-primary-dark', theme.hex.primaryDark);
  root.style.setProperty('--theme-secondary', theme.hex.secondary);
  root.style.setProperty('--theme-secondary-light', theme.hex.secondaryLight);
  root.style.setProperty('--theme-accent', theme.hex.accent);
  root.style.setProperty('--theme-accent-light', theme.hex.accentLight);
  root.style.setProperty('--theme-gradient-from', theme.hex.gradientFrom);
  root.style.setProperty('--theme-gradient-to', theme.hex.gradientTo);
  root.style.setProperty('--theme-sidebar-bg', theme.hex.sidebarBg);
  root.style.setProperty('--theme-sidebar-text', theme.hex.sidebarText);
  root.style.setProperty('--theme-sidebar-hover', theme.hex.sidebarHover);
}
