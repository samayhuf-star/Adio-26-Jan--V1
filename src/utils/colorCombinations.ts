/**
 * Beautiful Color Combinations for Dashboard Themes
 * Each combination includes primary, secondary, and accent colors
 */

export interface ColorCombination {
  id: string;
  name: string;
  primary: string;      // Main brand color
  secondary: string;   // Secondary/accent color
  tertiary?: string;   // Optional third color
  description: string;
}

export const COLOR_COMBINATIONS: ColorCombination[] = [
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    primary: '#0ea5e9',      // Sky blue
    secondary: '#06b6d4',   // Cyan
    tertiary: '#3b82f6',    // Blue
    description: 'Fresh and calming ocean-inspired palette'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    primary: '#f97316',      // Orange
    secondary: '#ef4444',    // Red
    tertiary: '#f59e0b',     // Amber
    description: 'Warm and energetic sunset colors'
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    primary: '#10b981',      // Emerald
    secondary: '#059669',    // Emerald dark
    tertiary: '#22c55e',     // Green
    description: 'Natural and refreshing green tones'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    primary: '#8b5cf6',      // Violet
    secondary: '#a855f7',    // Purple
    tertiary: '#9333ea',     // Purple dark
    description: 'Elegant and sophisticated purple shades'
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    primary: '#ec4899',      // Pink
    secondary: '#f43f5e',    // Rose
    tertiary: '#db2777',     // Pink dark
    description: 'Luxurious and modern rose gold palette'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    primary: '#1e40af',      // Blue dark
    secondary: '#3b82f6',   // Blue
    tertiary: '#2563eb',     // Blue medium
    description: 'Professional and trustworthy deep blue'
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    primary: '#14b8a6',      // Teal
    secondary: '#06b6d4',   // Cyan
    tertiary: '#10b981',     // Emerald
    description: 'Vibrant and tropical teal-cyan blend'
  }
];

/**
 * Get color combination by ID
 */
export function getColorCombination(id: string): ColorCombination | undefined {
  return COLOR_COMBINATIONS.find(combo => combo.id === id);
}

/**
 * Get default color combination
 */
export function getDefaultColorCombination(): ColorCombination {
  return COLOR_COMBINATIONS[0]; // Ocean Breeze
}

