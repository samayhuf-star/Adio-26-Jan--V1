import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, defaultTheme, getStoredTheme, saveTheme, applyThemeToDOM } from '../utils/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme());

  const setTheme = (themeId: string) => {
    const newTheme = themes[themeId] || defaultTheme;
    setThemeState(newTheme);
    saveTheme(themeId);
    applyThemeToDOM(newTheme);
  };

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const availableThemes = Object.values(themes);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

