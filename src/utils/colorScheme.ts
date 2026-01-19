/**
 * Unified Color Scheme for Adiology Dashboard
 * 
 * This defines the consistent 3-color palette used throughout the entire application:
 * - Primary: Indigo (main brand color, buttons, highlights)
 * - Secondary: Purple (accents, secondary elements)
 * - Tertiary: Cyan (success states, complementary accents)
 */

export const COLORS = {
  // Primary Color - Indigo
  primary: {
    50: 'indigo-50',
    100: 'indigo-100',
    200: 'indigo-200',
    300: 'indigo-300',
    400: 'indigo-400',
    500: 'indigo-500',
    600: 'indigo-600',
    700: 'indigo-700',
    800: 'indigo-800',
    900: 'indigo-900',
  },
  
  // Secondary Color - Purple
  secondary: {
    50: 'purple-50',
    100: 'purple-100',
    200: 'purple-200',
    300: 'purple-300',
    400: 'purple-400',
    500: 'purple-500',
    600: 'purple-600',
    700: 'purple-700',
    800: 'purple-800',
    900: 'purple-900',
  },
  
  // Tertiary/Accent Color - Cyan
  tertiary: {
    50: 'cyan-50',
    100: 'cyan-100',
    200: 'cyan-200',
    300: 'cyan-300',
    400: 'cyan-400',
    500: 'cyan-500',
    600: 'cyan-600',
    700: 'cyan-700',
    800: 'cyan-800',
    900: 'cyan-900',
  },
  
  // Neutral colors (for backgrounds, text, borders)
  neutral: {
    50: 'slate-50',
    100: 'slate-100',
    200: 'slate-200',
    300: 'slate-300',
    400: 'slate-400',
    500: 'slate-500',
    600: 'slate-600',
    700: 'slate-700',
    800: 'slate-800',
    900: 'slate-900',
  }
} as const;

// Pre-defined class combinations for common use cases
export const COLOR_CLASSES = {
  // Gradients
  primaryGradient: 'from-indigo-600 to-purple-600',
  primaryGradientHover: 'hover:from-indigo-700 hover:to-purple-700',
  primaryGradientLight: 'from-indigo-50 to-purple-50',
  accentGradient: 'from-cyan-500 to-indigo-500',
  
  // Backgrounds
  primaryBg: 'bg-indigo-600',
  primaryBgHover: 'hover:bg-indigo-700',
  primaryBgLight: 'bg-indigo-50',
  secondaryBg: 'bg-purple-600',
  secondaryBgLight: 'bg-purple-50',
  tertiaryBg: 'bg-cyan-600',
  tertiaryBgLight: 'bg-cyan-50',
  
  // Text colors
  primaryText: 'text-indigo-600',
  primaryTextDark: 'text-indigo-900',
  primaryTextHover: 'group-hover:text-indigo-600',
  secondaryText: 'text-purple-600',
  secondaryTextDark: 'text-purple-900',
  tertiaryText: 'text-cyan-600',
  
  // Borders
  primaryBorder: 'border-indigo-200',
  primaryBorderHover: 'hover:border-indigo-300',
  secondaryBorder: 'border-purple-200',
  tertiaryBorder: 'border-cyan-200',
  
  // Buttons
  primaryButton: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700',
  primaryButtonOutline: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50',
  secondaryButton: 'bg-purple-600 text-white hover:bg-purple-700',
  tertiaryButton: 'bg-cyan-600 text-white hover:bg-cyan-700',
  
  // Cards
  primaryCard: 'bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30',
  accentCard: 'bg-gradient-to-br from-white via-cyan-50/20 to-indigo-50/20',
  
  // Badges
  primaryBadge: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  secondaryBadge: 'bg-purple-100 text-purple-700 border-purple-300',
  tertiaryBadge: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  
  // Focus/Ring states
  primaryFocus: 'focus:border-indigo-400 focus:ring-indigo-400',
  secondaryFocus: 'focus:border-purple-400 focus:ring-purple-400',
  
  // Page headers
  pageHeaderGradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  
  // Section headers
  sectionHeader: 'text-indigo-900',
  sectionHeaderIcon: 'text-indigo-600',
} as const;

// Helper function to get color class by intensity
export const getColorClass = (
  colorType: 'primary' | 'secondary' | 'tertiary' | 'neutral',
  intensity: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
  prefix: 'bg' | 'text' | 'border' = 'bg'
): string => {
  return `${prefix}-${COLORS[colorType][intensity]}`;
};

// Export individual color values for direct use
export const PRIMARY_COLORS = COLORS.primary;
export const SECONDARY_COLORS = COLORS.secondary;
export const TERTIARY_COLORS = COLORS.tertiary;
export const NEUTRAL_COLORS = COLORS.neutral;

