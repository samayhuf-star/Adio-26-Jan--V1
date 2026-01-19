export interface TemplateData {
  slug: string;
  title: string;
  themeId: string;
  navigation?: {
    logo: string;
    links: Array<{
      text: string;
      url: string;
    }>;
    ctaText?: string;
    ctaUrl?: string;
  };
  hero: {
    heading: string;
    subheading: string;
    ctaText: string;
  };
  hero_image: string;
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
    subheading: string;
    items: Array<{
      image: string;
      title: string;
      desc: string;
      price: string;
    }>;
  };
  testimonials: {
    heading: string;
    items: Array<{
      name: string;
      company: string;
      rating: number;
      text: string;
      avatar: string;
    }>;
  };
  aboutUs?: {
    heading: string;
    description: string;
    image?: string;
    values?: Array<{
      title: string;
      desc: string;
    }>;
  };
  cta: {
    heading: string;
    subheading: string;
    ctaText: string;
  };
  contact: {
    phone: string;
    email: string;
    hours: string;
  };
  contactForm?: {
    heading: string;
    subheading: string;
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'email' | 'phone' | 'textarea';
      required: boolean;
    }>;
    submitText: string;
  };
  footer: {
    companyName: string;
    tagline: string;
    address: string;
    links: Array<{ text: string; href: string }>;
    copyright: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  styles?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    heroTextColor?: string;
    buttonStyle?: string;
    sectionPadding?: string;
    cardPadding?: string;
    spacing?: 'compact' | 'normal' | 'spacious';
  };
  // Raw HTML/CSS from visual builder edits
  rawHtml?: string;
  rawCss?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changes?: string;
  screenshot?: string;
}

export interface SavedWebsite {
  id: string;
  templateSlug: string;
  name: string;
  data: TemplateData;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'microedits_saved_websites';

export function getSavedWebsites(): SavedWebsite[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading saved websites:', e);
  }
  return [];
}

export function getSavedWebsite(id: string): SavedWebsite | null {
  const websites = getSavedWebsites();
  return websites.find(w => w.id === id) || null;
}

export function createSavedWebsite(templateSlug: string, name: string, data: TemplateData): SavedWebsite {
  const websites = getSavedWebsites();
  const now = new Date().toISOString();
  
  const newWebsite: SavedWebsite = {
    id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    templateSlug,
    name,
    data: JSON.parse(JSON.stringify(data)),
    messages: [],
    createdAt: now,
    updatedAt: now
  };
  
  websites.push(newWebsite);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(websites));
  } catch (error) {
    console.warn('localStorage quota exceeded, cleaning up old websites...');
    // Keep only the 5 most recent websites plus the new one
    const recentWebsites = websites.slice(-6);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentWebsites));
    } catch (e) {
      console.error('Still cannot save to localStorage:', e);
    }
  }
  
  return newWebsite;
}

export function updateSavedWebsite(id: string, updates: Partial<Pick<SavedWebsite, 'name' | 'data' | 'messages'>>): SavedWebsite | null {
  const websites = getSavedWebsites();
  const index = websites.findIndex(w => w.id === id);
  
  if (index === -1) return null;
  
  websites[index] = {
    ...websites[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(websites));
  } catch (error) {
    console.warn('localStorage quota exceeded during update');
  }
  return websites[index];
}

export function deleteSavedWebsite(id: string): boolean {
  const websites = getSavedWebsites();
  const filtered = websites.filter(w => w.id !== id);
  
  if (filtered.length === websites.length) return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('localStorage error during delete');
  }
  return true;
}

export function generateTemplateHTML(data: TemplateData): string {
  const styles = data.styles || {};
  const primaryColor = styles.primaryColor || '#16a34a';
  const secondaryColor = styles.secondaryColor || '#15803d';
  const sectionPadding = styles.sectionPadding || '4rem';
  const cardPadding = styles.cardPadding || '1.5rem';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.seo.title}</title>
  <meta name="description" content="${data.seo.description}">
  <meta name="keywords" content="${data.seo.keywords}">
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-14J6XMRK1E"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-14J6XMRK1E');
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${styles.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}; line-height: 1.6; color: #1f2937; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    
    /* Hero */
    .hero { 
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${data.hero_image}') center/cover; 
      min-height: 500px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      text-align: center; 
      color: ${styles.heroTextColor || 'white'}; 
      padding: 4rem 1rem;
    }
    .hero h1 { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
    .hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
    .btn-primary { 
      background: ${primaryColor}; 
      color: white; 
      padding: 0.75rem 2rem; 
      border: none; 
      border-radius: 0.5rem; 
      font-size: 1rem; 
      font-weight: 600; 
      cursor: pointer; 
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary:hover { background: ${secondaryColor}; }
    
    /* Features */
    .features { padding: ${sectionPadding} 1rem; background: white; }
    .features h2 { text-align: center; font-size: 2rem; margin-bottom: 3rem; color: #1f2937; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
    .feature-card { text-align: center; padding: ${cardPadding}; background: #f0fdf4; border-radius: 0.75rem; }
    .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .feature-card h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    .feature-card p { color: #4b5563; font-size: 0.875rem; }
    
    /* Services */
    .services { padding: ${sectionPadding} 1rem; background: #f9fafb; }
    .services h2 { text-align: center; font-size: 2rem; margin-bottom: 0.5rem; }
    .services > p { text-align: center; color: #6b7280; margin-bottom: 3rem; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .service-card { background: white; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .service-card img { width: 100%; height: 200px; object-fit: cover; }
    .service-card-content { padding: ${cardPadding}; }
    .service-card h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    .service-card p { color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem; }
    .service-price { color: ${primaryColor}; font-weight: bold; }
    
    /* Testimonials */
    .testimonials { padding: ${sectionPadding} 1rem; background: white; }
    .testimonials h2 { text-align: center; font-size: 2rem; margin-bottom: 3rem; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .testimonial-card { background: #f9fafb; padding: ${cardPadding}; border-radius: 0.75rem; }
    .testimonial-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .testimonial-name { font-weight: 600; }
    .testimonial-company { color: #6b7280; font-size: 0.875rem; }
    .stars { color: #fbbf24; margin-bottom: 0.75rem; }
    .testimonial-text { color: #4b5563; font-style: italic; font-size: 0.875rem; }
    
    /* CTA */
    .cta { 
      padding: ${sectionPadding} 1rem; 
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); 
      text-align: center; 
      color: white; 
    }
    .cta h2 { font-size: 2rem; margin-bottom: 0.5rem; }
    .cta p { font-size: 1.125rem; margin-bottom: 2rem; opacity: 0.9; }
    .btn-white { 
      background: white; 
      color: ${primaryColor}; 
      padding: 0.75rem 2rem; 
      border: none; 
      border-radius: 0.5rem; 
      font-size: 1rem; 
      font-weight: 600; 
      cursor: pointer; 
      text-decoration: none;
    }
    
    /* Footer */
    .footer { background: #1f2937; color: white; padding: 3rem 1rem 1.5rem; }
    .footer-content { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 2rem; margin-bottom: 2rem; }
    .footer-brand h3 { font-size: 1.25rem; font-weight: bold; }
    .footer-brand p { color: #9ca3af; font-size: 0.875rem; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { color: #9ca3af; text-decoration: none; font-size: 0.875rem; }
    .footer-links a:hover { color: white; }
    .footer-contact { display: flex; flex-wrap: wrap; gap: 2rem; margin-bottom: 2rem; padding-top: 2rem; border-top: 1px solid #374151; }
    .contact-item { color: #9ca3af; font-size: 0.875rem; }
    .footer-copyright { text-align: center; color: #6b7280; font-size: 0.75rem; padding-top: 1.5rem; border-top: 1px solid #374151; }
    
    /* Navigation */
    .nav { background: white; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 50; }
    .nav-container { max-width: 1200px; margin: 0 auto; padding: 1rem; display: flex; align-items: center; justify-content: space-between; }
    .nav-logo { font-size: 1.25rem; font-weight: bold; color: #111827; text-decoration: none; }
    .nav-links { display: flex; align-items: center; gap: 1.5rem; }
    .nav-links a { color: #4b5563; text-decoration: none; font-weight: 500; transition: color 0.2s; }
    .nav-links a:hover { color: #111827; }
    .nav-cta { background: ${primaryColor}; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
    .nav-cta:hover { background: ${secondaryColor}; }
    .nav-hamburger { display: none; flex-direction: column; gap: 4px; cursor: pointer; padding: 8px; }
    .nav-hamburger span { display: block; width: 20px; height: 2px; background: #374151; }
    .mobile-menu { display: none; background: white; border-bottom: 1px solid #e5e7eb; padding: 1rem; }
    .mobile-menu.active { display: block; }
    .mobile-menu a { display: block; padding: 0.75rem 1rem; color: #4b5563; text-decoration: none; border-radius: 0.5rem; }
    .mobile-menu a:hover { background: #f3f4f6; }
    
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .hero p { font-size: 1rem; }
      .nav-links { display: none !important; }
      .nav-hamburger { display: flex; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-container">
      <a href="#" class="nav-logo">${data.navigation?.logo || data.footer?.companyName || 'Company'}</a>
      <div class="nav-links">
        ${(data.navigation?.links || [
          { text: 'Home', url: '#' },
          { text: 'Services', url: '#services' },
          { text: 'About', url: '#about' },
          { text: 'Contact', url: '#contact' }
        ]).map(link => `<a href="${link.url}">${link.text}</a>`).join('')}
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="${data.navigation?.ctaUrl || '#contact'}" class="nav-cta">${data.navigation?.ctaText || 'Get Started'}</a>
        <div class="nav-hamburger" onclick="document.querySelector('.mobile-menu').classList.toggle('active')">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </nav>
  <div class="mobile-menu">
    ${(data.navigation?.links || [
      { text: 'Home', url: '#' },
      { text: 'Services', url: '#services' },
      { text: 'About', url: '#about' },
      { text: 'Contact', url: '#contact' }
    ]).map(link => `<a href="${link.url}">${link.text}</a>`).join('')}
  </div>

  <section class="hero">
    <div>
      <h1>${data.hero.heading}</h1>
      <p>${data.hero.subheading}</p>
      <a href="#contact" class="btn-primary">${data.hero.ctaText}</a>
    </div>
  </section>

  <section class="features">
    <div class="container">
      <h2>${data.features.heading}</h2>
      <div class="features-grid">
        ${data.features.items.map(item => `
        <div class="feature-card">
          <div class="feature-icon">${item.icon}</div>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="services" id="services">
    <div class="container">
      <h2>${data.services.heading}</h2>
      <p>${data.services.subheading}</p>
      <div class="services-grid">
        ${data.services.items.map(item => `
        <div class="service-card">
          <img src="${item.image}" alt="${item.title}">
          <div class="service-card-content">
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
            <span class="service-price">${item.price}</span>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="testimonials">
    <div class="container">
      <h2>${data.testimonials.heading}</h2>
      <div class="testimonials-grid">
        ${data.testimonials.items.map(item => `
        <div class="testimonial-card">
          <div class="testimonial-header">
            <img src="${item.avatar}" alt="${item.name}" class="testimonial-avatar">
            <div>
              <div class="testimonial-name">${item.name}</div>
              <div class="testimonial-company">${item.company}</div>
            </div>
          </div>
          <div class="stars">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</div>
          <p class="testimonial-text">"${item.text}"</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container">
      <h2>${data.cta.heading}</h2>
      <p>${data.cta.subheading}</p>
      <a href="#contact" class="btn-white">${data.cta.ctaText}</a>
    </div>
  </section>

  <footer class="footer" id="contact">
    <div class="container">
      <div class="footer-contact">
        <span class="contact-item">📞 ${data.contact.phone}</span>
        <span class="contact-item">✉️ ${data.contact.email}</span>
        <span class="contact-item">🕐 ${data.contact.hours}</span>
      </div>
      <div class="footer-content">
        <div class="footer-brand">
          <h3>${data.footer.companyName}</h3>
          <p>${data.footer.tagline}</p>
        </div>
        <div class="footer-links">
          ${data.footer.links.map(link => `<a href="${link.href}">${link.text}</a>`).join('')}
        </div>
      </div>
      <p class="footer-copyright">${data.footer.copyright}</p>
    </div>
  </footer>
</body>
</html>`;
}

export function downloadTemplate(data: TemplateData, filename?: string) {
  const html = generateTemplateHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${data.slug}-website.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
