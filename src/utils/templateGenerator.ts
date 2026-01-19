/**
 * Template Generator Utilities
 * Integration layer between React components and the template generation system
 */

export interface TemplateManifest {
  slug: string;
  title: string;
  themeId?: string;
  hero: {
    heading: string;
    subheading: string;
    ctaText: string;
  };
  hero_image?: string;
  features: {
    heading: string;
    items: Array<{
      icon: string;
      title: string;
      desc: string;
    }>;
  };
  services: {
    heading: string;
    subheading?: string;
    items: Array<{
      image?: string;
      title: string;
      desc: string;
      price?: string;
    }>;
  };
  testimonials?: {
    heading: string;
    items: Array<{
      name: string;
      company?: string;
      rating: number;
      text: string;
      avatar?: string;
    }>;
  };
  cta: {
    heading: string;
    subheading?: string;
    ctaText: string;
  };
  contact: {
    phone: string;
    email?: string;
    hours?: string;
  };
  footer: {
    companyName: string;
    tagline: string;
    address: string;
    links: Array<{
      text: string;
      href: string;
    }>;
    copyright: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  policies?: {
    privacy?: {
      lastUpdated: string;
      content: string;
    };
    terms?: {
      lastUpdated: string;
      content: string;
    };
  };
}

/**
 * Convert old template format to new manifest format
 */
export function convertOldTemplateToManifest(oldTemplate: any): TemplateManifest {
  const heroSection = oldTemplate.sections?.find((s: any) => s.type === 'hero');
  const featuresSection = oldTemplate.sections?.find((s: any) => s.type === 'features');
  const servicesSection = oldTemplate.sections?.find((s: any) => s.type === 'services');
  const testimonialsSection = oldTemplate.sections?.find((s: any) => s.type === 'testimonials');
  const ctaSection = oldTemplate.sections?.find((s: any) => s.type === 'cta');
  const footerSection = oldTemplate.sections?.find((s: any) => s.type === 'footer');
  const privacySection = oldTemplate.sections?.find((s: any) => s.type === 'privacy');
  const termsSection = oldTemplate.sections?.find((s: any) => s.type === 'terms');

  return {
    slug: oldTemplate.id?.replace(/\s+/g, '-').toLowerCase() || 'template',
    title: oldTemplate.name || 'Template',
    themeId: 'green-edge',
    hero: {
      heading: heroSection?.content?.heading || 'Welcome',
      subheading: heroSection?.content?.subheading || '',
      ctaText: heroSection?.content?.ctaText || 'Get Started',
    },
    hero_image: heroSection?.content?.backgroundImage,
    features: {
      heading: featuresSection?.content?.heading || 'Features',
      items: (featuresSection?.content?.features || []).map((f: any) => ({
        icon: f.icon || '✓',
        title: f.title || '',
        desc: f.description || '',
      })),
    },
    services: {
      heading: servicesSection?.content?.heading || 'Services',
      subheading: servicesSection?.content?.subheading,
      items: (servicesSection?.content?.services || []).map((s: any) => ({
        image: s.image,
        title: s.title || '',
        desc: s.description || '',
        price: s.price,
      })),
    },
    testimonials: testimonialsSection ? {
      heading: testimonialsSection.content?.heading || 'Testimonials',
      items: (testimonialsSection.content?.testimonials || []).map((t: any) => ({
        name: t.name || '',
        company: t.company,
        rating: t.rating || 5,
        text: t.text || '',
        avatar: t.avatar,
      })),
    } : undefined,
    cta: {
      heading: ctaSection?.content?.heading || 'Get Started',
      subheading: ctaSection?.content?.subheading,
      ctaText: ctaSection?.content?.ctaText || 'Contact Us',
    },
    contact: {
      phone: ctaSection?.content?.phone || footerSection?.content?.phone || '1-800-123-4567',
      email: ctaSection?.content?.email || footerSection?.content?.email,
      hours: ctaSection?.content?.hours,
    },
    footer: {
      companyName: footerSection?.content?.companyName || oldTemplate.name || 'Company',
      tagline: footerSection?.content?.tagline || '',
      address: footerSection?.content?.address || '',
      links: (footerSection?.content?.links || []).map((l: any) => ({
        text: l.text || l.href || '',
        href: l.href || l.url || '#',
      })),
      copyright: footerSection?.content?.copyright || `© ${new Date().getFullYear()} ${oldTemplate.name || 'Company'}. All rights reserved.`,
    },
    seo: {
      title: oldTemplate.name || 'Template',
      description: oldTemplate.description || '',
      keywords: oldTemplate.category || '',
    },
    policies: {
      privacy: privacySection ? {
        lastUpdated: privacySection.content?.lastUpdated || new Date().toISOString().split('T')[0],
        content: privacySection.content?.content || '',
      } : undefined,
      terms: termsSection ? {
        lastUpdated: termsSection.content?.lastUpdated || new Date().toISOString().split('T')[0],
        content: termsSection.content?.content || '',
      } : undefined,
    },
  };
}

/**
 * Download manifest as JSON file
 */
export function downloadManifest(manifest: TemplateManifest, filename?: string) {
  const json = JSON.stringify(manifest, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${manifest.slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Load manifest from JSON file
 */
export async function loadManifestFromFile(file: File): Promise<TemplateManifest> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const manifest = JSON.parse(e.target?.result as string);
        resolve(manifest);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.slug) errors.push('Missing slug');
  if (!manifest.title) errors.push('Missing title');
  if (!manifest.hero) errors.push('Missing hero section');
  if (!manifest.features) errors.push('Missing features section');
  if (!manifest.services) errors.push('Missing services section');
  if (!manifest.cta) errors.push('Missing CTA section');
  if (!manifest.contact) errors.push('Missing contact information');
  if (!manifest.footer) errors.push('Missing footer section');
  if (!manifest.seo) errors.push('Missing SEO information');

  return {
    valid: errors.length === 0,
    errors,
  };
}

