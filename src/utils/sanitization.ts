// Content sanitization utilities

// Simple HTML sanitizer for basic use cases
export function sanitizeHTML(html: string): string {
  // Create a temporary div element
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// CSS sanitizer for style content
export function sanitizeCSS(css: string): string {
  // Remove potentially dangerous CSS properties and values
  const dangerousPatterns = [
    /javascript:/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*javascript:/gi,
    /url\s*\(\s*data:/gi,
    /@import/gi,
    /behavior\s*:/gi,
    /-moz-binding/gi,
    /position\s*:\s*fixed/gi,
  ];

  let sanitized = css;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
}

// Safe CSS variable generator for chart themes
export function generateSafeCSS(
  id: string,
  themes: Record<string, string>,
  colorConfig: Array<[string, any]>
): string {
  // Validate and sanitize the ID
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '');
  
  if (!safeId) {
    throw new Error('Invalid chart ID provided');
  }

  const cssRules: string[] = [];

  Object.entries(themes).forEach(([theme, prefix]) => {
    const safePrefix = prefix.replace(/[^a-zA-Z0-9-_.\s[\]:]/g, '');
    const selector = `${safePrefix} [data-chart="${safeId}"]`;
    
    const rules = colorConfig.map(([key, itemConfig]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
      const color = itemConfig?.color || itemConfig;
      
      // Validate color format (hex, rgb, hsl, or named colors)
      if (!isValidColor(color)) {
        console.warn(`Invalid color value: ${color}`);
        return '';
      }
      
      return `  --color-${safeKey}: ${color};`;
    }).filter(Boolean);

    if (rules.length > 0) {
      cssRules.push(`${selector} {\n${rules.join('\n')}\n}`);
    }
  });

  return cssRules.join('\n\n');
}

// Validate color values
function isValidColor(color: string): boolean {
  if (typeof color !== 'string') return false;
  
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  // Check for hsl/hsla colors
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  // Check for named colors (basic set)
  const namedColors = [
    'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'transparent', 'currentColor'
  ];
  
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

// Safe attribute sanitizer
export function sanitizeAttributes(attributes: Record<string, any>): Record<string, string> {
  const safe: Record<string, string> = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    // Only allow safe attribute names
    if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(key)) {
      // Convert value to string and sanitize
      const stringValue = String(value);
      
      // Remove potentially dangerous content
      const sanitizedValue = stringValue
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/style\s*=/gi, '');
      
      safe[key] = sanitizedValue;
    }
  });
  
  return safe;
}

// URL sanitizer
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!safeProtocols.includes(parsed.protocol)) {
      return '#';
    }
    
    return parsed.toString();
  } catch {
    return '#';
  }
}

// Text content sanitizer (removes HTML tags)
export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

// Safe innerHTML replacement using textContent
export function setSafeHTML(element: HTMLElement, content: string): void {
  // Clear existing content
  element.innerHTML = '';
  
  // Set as text content to prevent XSS
  element.textContent = content;
}

// Create safe style element
export function createSafeStyleElement(css: string, id?: string): HTMLStyleElement {
  const style = document.createElement('style');
  
  if (id) {
    style.id = id.replace(/[^a-zA-Z0-9-_]/g, '');
  }
  
  // Sanitize CSS content
  const safeCss = sanitizeCSS(css);
  style.textContent = safeCss;
  
  return style;
}

// Safe data attribute setter
export function setSafeDataAttribute(element: HTMLElement, name: string, value: string): void {
  // Validate attribute name
  const safeName = name.replace(/[^a-zA-Z0-9-]/g, '');
  if (!safeName) return;
  
  // Sanitize value
  const safeValue = sanitizeText(value);
  
  element.setAttribute(`data-${safeName}`, safeValue);
}

// Input validation utilities
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  alphanumeric: (text: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(text);
  },
  
  alphanumericWithSpaces: (text: string): boolean => {
    return /^[a-zA-Z0-9\s]+$/.test(text);
  },
  
  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  },
  
  safeFilename: (filename: string): boolean => {
    return /^[a-zA-Z0-9._-]+$/.test(filename);
  }
};
