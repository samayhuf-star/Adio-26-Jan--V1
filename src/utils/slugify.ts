/**
 * URL Slug and Website Naming Utilities
 * 
 * Provides clean, SEO-friendly URL generation and consistent naming conventions
 * for saved websites and templates.
 */

/**
 * Generate a clean, SEO-friendly URL slug from a name
 * 
 * Rules:
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes all special characters except hyphens
 * - Collapses multiple consecutive hyphens into one
 * - Trims leading/trailing hyphens
 * - Limits length to 60 characters
 * - Ensures minimum 3 characters (adds 'site' if too short)
 */
export function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'untitled-site';
  }

  let slug = name
    .toLowerCase()
    .trim()
    // Replace common separators with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove date patterns like 17/12/2025 or 17-12-2025 (convert to simpler format)
    .replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, '$1$2$3')
    // Remove all characters except letters, numbers, and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Collapse multiple consecutive hyphens into single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Limit length to 60 characters, but try to break at word boundary
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
    // Try to break at a hyphen to avoid cutting words
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > 40) {
      slug = slug.substring(0, lastHyphen);
    }
    // Remove trailing hyphen if any
    slug = slug.replace(/-+$/, '');
  }

  // Ensure minimum length
  if (slug.length < 3) {
    slug = slug ? `${slug}-site` : 'untitled-site';
  }

  return slug;
}

/**
 * Generate a unique slug by appending a numeric suffix if needed
 */
export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(name);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Find the next available number
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}

/**
 * Clean and normalize a website name
 * 
 * Rules:
 * - Trims whitespace
 * - Limits to 100 characters
 * - Provides sensible default if empty
 */
export function cleanWebsiteName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Untitled Website';
  }

  const cleaned = name.trim();
  
  if (!cleaned) {
    return 'Untitled Website';
  }

  // Limit to 100 characters
  if (cleaned.length > 100) {
    return cleaned.substring(0, 97) + '...';
  }

  return cleaned;
}

/**
 * Generate a name for a duplicated website
 * 
 * Format: "Original Name (Copy)" or "Original Name (Copy 2)" for subsequent copies
 */
export function generateDuplicateName(originalName: string, existingNames: string[]): string {
  const baseName = cleanWebsiteName(originalName);
  
  // Remove existing copy suffix if present
  const copyPattern = /\s*\(Copy(?:\s+\d+)?\)$/;
  const cleanBase = baseName.replace(copyPattern, '').trim();
  
  // Try simple "Copy" first
  let newName = `${cleanBase} (Copy)`;
  if (!existingNames.includes(newName)) {
    return newName;
  }

  // Find the next available number
  let counter = 2;
  while (existingNames.includes(`${cleanBase} (Copy ${counter})`)) {
    counter++;
  }

  return `${cleanBase} (Copy ${counter})`;
}

/**
 * Generate a default website name from a template
 */
export function generateDefaultName(templateName?: string): string {
  if (templateName) {
    return cleanWebsiteName(templateName);
  }
  
  // Generate name with date
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return `Website - ${dateStr}`;
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Must be lowercase, only letters, numbers, hyphens
  // No consecutive hyphens, no leading/trailing hyphens
  // Between 3 and 60 characters
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slug.length >= 3 && slug.length <= 60 && slugPattern.test(slug);
}

/**
 * Format a URL-friendly display for templates
 */
export function formatTemplateUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/templates/${slug}`;
}
