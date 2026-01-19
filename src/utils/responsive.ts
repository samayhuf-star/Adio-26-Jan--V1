/**
 * Responsive Utilities for Auto-Adjustment
 * Automatically adjusts display, cards, menus, icons based on screen size
 */

import { useEffect, useState } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1280,
};

/**
 * Hook to get current screen size and breakpoint info
 */
export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.largeDesktop,
        isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}

/**
 * Get responsive grid columns based on screen size
 */
export function getResponsiveGridCols(screenSize: ScreenSize): string {
  if (screenSize.isMobile) return 'grid-cols-1';
  if (screenSize.isTablet) return 'grid-cols-2';
  if (screenSize.isDesktop) return 'grid-cols-3';
  return 'grid-cols-4';
}

/**
 * Get responsive padding based on screen size
 */
export function getResponsivePadding(screenSize: ScreenSize): string {
  if (screenSize.isMobile) return 'p-4';
  if (screenSize.isTablet) return 'p-6';
  return 'p-8';
}

/**
 * Get responsive gap based on screen size
 */
export function getResponsiveGap(screenSize: ScreenSize): string {
  if (screenSize.isMobile) return 'gap-4';
  if (screenSize.isTablet) return 'gap-6';
  return 'gap-8';
}

/**
 * Get responsive font size based on screen size
 */
export function getResponsiveFontSize(screenSize: ScreenSize, baseSize: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const sizes = {
    sm: { mobile: 'text-xs', tablet: 'text-sm', desktop: 'text-base' },
    md: { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-lg' },
    lg: { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-xl' },
    xl: { mobile: 'text-lg', tablet: 'text-xl', desktop: 'text-2xl' },
  };

  if (screenSize.isMobile) return sizes[baseSize].mobile;
  if (screenSize.isTablet) return sizes[baseSize].tablet;
  return sizes[baseSize].desktop;
}

/**
 * Get responsive icon size based on screen size
 */
export function getResponsiveIconSize(screenSize: ScreenSize): string {
  if (screenSize.isMobile) return 'w-4 h-4';
  if (screenSize.isTablet) return 'w-5 h-5';
  return 'w-6 h-6';
}

