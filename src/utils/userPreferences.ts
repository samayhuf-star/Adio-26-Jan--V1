/**
 * User Preferences Utility
 * Stores user-specific preferences in localStorage
 */

import { getColorCombination } from './colorCombinations';

export interface UserPreferences {
  spacing: number; // Spacing multiplier (0.75, 1.0, 1.25, 1.5, 1.75, 2.0)
  fontSize: number; // Font size multiplier (0.875, 1.0, 1.125, 1.25, 1.375, 1.5)
  colorTheme: 'default' | 'blue' | 'green' | 'custom' | 'ocean-breeze' | 'sunset-glow' | 'forest-canopy' | 'royal-purple' | 'rose-gold' | 'midnight-blue' | 'tropical-paradise'; // Color theme option
  customColor?: string; // Custom color hex value (e.g., '#6366f1')
  colorCombination?: string; // Color combination ID
  sidebarAutoClose: boolean; // Auto-close sidebar after selection (default: false - manual close only)
}

const DEFAULT_PREFERENCES: UserPreferences = {
  spacing: 1.0,
  fontSize: 1.0,
  colorTheme: 'default',
  sidebarAutoClose: false // Default: sidebar stays open, manual close only
};

const STORAGE_KEY = 'user_preferences';

/**
 * Get user preferences from localStorage
 */
export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applyUserPreferences(updated);
    
    // Dispatch custom event to notify other components in the same tab
    window.dispatchEvent(new Event('userPreferencesChanged'));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Apply user preferences to the DOM
 */
export function applyUserPreferences(prefs: UserPreferences): void {
  const root = document.documentElement;
  
  // Apply spacing
  root.style.setProperty('--user-spacing-multiplier', prefs.spacing.toString());
  
  // Apply font size
  root.style.setProperty('--user-font-size-multiplier', prefs.fontSize.toString());
  
  // Apply color theme
  root.setAttribute('data-color-theme', prefs.colorTheme);
  
  // List of color combination IDs
  const colorCombinationIds = ['ocean-breeze', 'sunset-glow', 'forest-canopy', 'royal-purple', 'rose-gold', 'midnight-blue', 'tropical-paradise'];
  
  // Check if current theme is a color combination
  const isColorCombination = colorCombinationIds.includes(prefs.colorTheme);
  const combinationId = prefs.colorCombination || (isColorCombination ? prefs.colorTheme : null);
  
  // Apply custom color if set
  if (prefs.colorTheme === 'custom' && prefs.customColor) {
    root.style.setProperty('--custom-primary-color', prefs.customColor);
    // Generate complementary colors for gradients
    const complementaryColor = generateComplementaryColor(prefs.customColor);
    root.style.setProperty('--custom-secondary-color', complementaryColor);
    root.style.removeProperty('--custom-tertiary-color');
  } else if (combinationId && (isColorCombination || prefs.colorCombination)) {
    // Apply color combination
    try {
      const combo = getColorCombination(combinationId);
      if (combo) {
        root.style.setProperty('--custom-primary-color', combo.primary);
        root.style.setProperty('--custom-secondary-color', combo.secondary);
        if (combo.tertiary) {
          root.style.setProperty('--custom-tertiary-color', combo.tertiary);
        } else {
          root.style.removeProperty('--custom-tertiary-color');
        }
      }
    } catch (e) {
      console.error('Failed to load color combination:', e);
      root.style.removeProperty('--custom-primary-color');
      root.style.removeProperty('--custom-secondary-color');
      root.style.removeProperty('--custom-tertiary-color');
    }
  } else {
    // Default theme - remove custom colors
    root.style.removeProperty('--custom-primary-color');
    root.style.removeProperty('--custom-secondary-color');
    root.style.removeProperty('--custom-tertiary-color');
  }
  
  // Remove other theme classes
  root.classList.remove('theme-default', 'theme-blue', 'theme-green', 'theme-custom');
  root.classList.add(`theme-${prefs.colorTheme}`);
}

/**
 * Generate a complementary color for gradients
 */
function generateComplementaryColor(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Generate complementary color (shift hue by 180 degrees)
  // Simplified: create a purple-like complement
  const compR = Math.min(255, Math.max(0, 255 - r));
  const compG = Math.min(255, Math.max(0, 255 - g));
  const compB = Math.min(255, Math.max(0, 255 - b));
  
  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(compR)}${toHex(compG)}${toHex(compB)}`;
}

/**
 * Initialize preferences on app load
 */
export function initializeUserPreferences(): void {
  const prefs = getUserPreferences();
  applyUserPreferences(prefs);
}

/**
 * Get spacing value with multiplier applied
 */
export function getSpacing(baseValue: number): string {
  const prefs = getUserPreferences();
  return `${baseValue * prefs.spacing}rem`;
}

/**
 * Get font size with multiplier applied
 */
export function getFontSize(baseSize: number): string {
  const prefs = getUserPreferences();
  return `${baseSize * prefs.fontSize}rem`;
}

