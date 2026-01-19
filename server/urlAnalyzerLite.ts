import * as cheerio from 'cheerio';

interface AnalysisResult {
  success: boolean;
  url: string;
  headings: Array<{ level: string; text: string }>;
  ctaElements: Array<{ text: string; type: string; href?: string }>;
  forms: Array<{ action: string; method: string; fields: string[] }>;
  images: Array<{ src: string; alt: string }>;
  navigation: string[];
  schemas: any[];
  seoSignals: {
    title: string;
    metaDescription: string;
    canonical: string;
    robots: string;
    viewport: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    h1Count: number;
    wordCount: number;
  };
  keyMessaging: string[];
  testimonials: Array<{ text: string }>;
  faqs: Array<{ question: string; answer: string }>;
  contactInfo: {
    phones: string[];
    emails: string[];
    addresses: string[];
  };
  services: string[];
  mainContent: string;
  links: {
    internal: string[];
    external: string[];
  };
  analysisMethod: 'cheerio';
}

function cleanText(text: string | undefined): string {
  return (text || '').trim().replace(/\s+/g, ' ').slice(0, 500);
}

export async function analyzeUrlWithCheerio(url: string): Promise<AnalysisResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);

  const headings: Array<{ level: string; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = cleanText($(el).text());
    const tagName = (el as any).name || (el as any).tagName || 'h1';
    if (text && text.length > 2) {
      headings.push({ level: tagName.toLowerCase(), text });
    }
  });

  const ctaElements: Array<{ text: string; type: string; href?: string }> = [];
  const ctaSelectors = 'button, [role="button"], a.btn, a.button, a.cta, .cta, [class*="cta"], [class*="btn-"], input[type="submit"], a[href*="contact"], a[href*="quote"], a[href*="book"], a[href*="call"]';
  $(ctaSelectors).each((_, el) => {
    const text = cleanText($(el).text());
    const href = $(el).attr('href');
    const tagName = (el as any).name || (el as any).tagName || 'button';
    if (text && text.length > 1 && text.length < 100) {
      ctaElements.push({
        text,
        type: tagName.toLowerCase(),
        href: href?.startsWith('http') ? href : undefined
      });
    }
  });

  const forms: Array<{ action: string; method: string; fields: string[] }> = [];
  $('form').each((_, form) => {
    const fields: string[] = [];
    $(form).find('input, select, textarea').each((_, field) => {
      const name = $(field).attr('name') || $(field).attr('placeholder') || $(field).attr('aria-label') || '';
      const tagName = (field as any).name || (field as any).tagName || 'input';
      const type = $(field).attr('type') || tagName.toLowerCase();
      if (name) fields.push(`${type}: ${name}`);
    });
    if (fields.length > 0) {
      forms.push({
        action: $(form).attr('action') || '',
        method: $(form).attr('method') || 'get',
        fields
      });
    }
  });

  const images: Array<{ src: string; alt: string }> = [];
  $('img').each((_, img) => {
    let src = $(img).attr('src') || '';
    const alt = $(img).attr('alt') || '';
    if (src && !src.includes('data:image')) {
      if (src.startsWith('/')) {
        src = `${baseUrl.origin}${src}`;
      }
      images.push({ src: src.slice(0, 200), alt: alt.slice(0, 100) });
    }
  });

  const navigation: string[] = [];
  $('nav a, header a, [role="navigation"] a').each((_, link) => {
    const text = cleanText($(link).text());
    if (text && text.length > 1 && text.length < 50) {
      navigation.push(text);
    }
  });

  const schemas: any[] = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const data = JSON.parse($(script).html() || '{}');
      schemas.push(data);
    } catch (e) {}
  });

  const seoSignals = {
    title: $('title').text() || '',
    metaDescription: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    robots: $('meta[name="robots"]').attr('content') || '',
    viewport: $('meta[name="viewport"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    h1Count: $('h1').length,
    wordCount: $('body').text().split(/\s+/).filter(w => w.length > 0).length
  };

  const keyMessaging: string[] = [];
  $('.hero, [class*="hero"], .banner, [class*="banner"], section:first-of-type').each((_, section) => {
    const text = cleanText($(section).text());
    if (text && text.length > 20) {
      keyMessaging.push(text.slice(0, 300));
    }
  });

  const testimonials: Array<{ text: string }> = [];
  $('.testimonial, [class*="testimonial"], .review, [class*="review"], blockquote, .quote').each((_, el) => {
    const text = cleanText($(el).text());
    if (text && text.length > 20 && text.length < 500) {
      testimonials.push({ text });
    }
  });

  const faqs: Array<{ question: string; answer: string }> = [];
  $('.faq, [class*="faq"], .accordion, details, [itemtype*="FAQPage"]').each((_, el) => {
    const questionEl = $(el).find('summary, .question, dt, h3, h4, [itemprop="name"]').first();
    const answerEl = $(el).find('.answer, dd, p, [itemprop="text"]').first();
    const question = questionEl.text()?.trim() || '';
    const answer = answerEl.text()?.trim() || '';
    if (question && answer) {
      faqs.push({ question: question.slice(0, 200), answer: answer.slice(0, 500) });
    }
  });

  const contactInfo = { phones: [] as string[], emails: [] as string[], addresses: [] as string[] };
  const bodyText = $('body').text() || '';
  
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatches = bodyText.match(phoneRegex);
  if (phoneMatches) {
    contactInfo.phones = [...new Set(phoneMatches)].slice(0, 5);
  }
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = bodyText.match(emailRegex);
  if (emailMatches) {
    contactInfo.emails = [...new Set(emailMatches)].slice(0, 5);
  }

  const services: string[] = [];
  $('[class*="service"], .services, section').each((_, section) => {
    $(section).find('li, h3, h4, .service-item').each((_, item) => {
      const text = cleanText($(item).text());
      if (text && text.length > 3 && text.length < 100) {
        services.push(text);
      }
    });
  });

  const mainContent = cleanText($('body').text()).slice(0, 3000);

  const links = { internal: [] as string[], external: [] as string[] };
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (href.startsWith(baseUrl.origin) || href.startsWith('/')) {
      links.internal.push(href.startsWith('/') ? `${baseUrl.origin}${href}` : href);
    } else if (href.startsWith('http')) {
      links.external.push(href);
    }
  });

  return {
    success: true,
    url,
    headings: headings.slice(0, 30),
    ctaElements: ctaElements.slice(0, 20),
    forms: forms.slice(0, 5),
    images: images.slice(0, 20),
    navigation: [...new Set(navigation)].slice(0, 20),
    schemas,
    seoSignals,
    keyMessaging: keyMessaging.slice(0, 5),
    testimonials: testimonials.slice(0, 10),
    faqs: faqs.slice(0, 10),
    contactInfo,
    services: [...new Set(services)].slice(0, 30),
    mainContent,
    links: {
      internal: [...new Set(links.internal)].slice(0, 20),
      external: [...new Set(links.external)].slice(0, 20)
    },
    analysisMethod: 'cheerio'
  };
}
