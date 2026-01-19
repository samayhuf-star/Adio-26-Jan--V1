import { useEffect, useRef, useCallback, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { TemplateData } from '../utils/savedWebsites';
import { Plus, Layers, Trash2, Copy, ArrowUp, ArrowDown, Monitor, Tablet, Smartphone } from 'lucide-react';

interface DragDropBuilderProps {
  templateData: TemplateData;
  onUpdate: (html: string, css: string) => void;
  onSave: () => void;
}

function getTemplateCss(data: TemplateData): string {
  const primaryColor = data?.styles?.primaryColor || '#16a34a';
  
  return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; }
      .hero { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 80px 20px; text-align: center; min-height: 400px; }
      .hero-content { color: white; max-width: 800px; margin: 0 auto; }
      .hero h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
      .hero p { font-size: 1.25rem; margin-bottom: 1.5rem; opacity: 0.9; }
      .btn-primary { background: white; color: ${primaryColor}; padding: 12px 32px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; display: inline-block; text-decoration: none; }
      .section { padding: 60px 20px; }
      .section-title { font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #1f2937; }
      .section-subtitle { text-align: center; color: #6b7280; margin-bottom: 2rem; }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto; }
      .feature-card { text-align: center; padding: 24px; background: #f3f4f6; border-radius: 12px; }
      .feature-icon { font-size: 2rem; margin-bottom: 12px; }
      .feature-title { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
      .feature-desc { color: #6b7280; font-size: 0.875rem; }
      .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
      .service-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .service-image { width: 100%; height: 180px; object-fit: cover; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
      .service-content { padding: 20px; }
      .service-title { font-weight: 600; font-size: 1.125rem; color: #1f2937; margin-bottom: 8px; }
      .service-desc { color: #6b7280; font-size: 0.875rem; margin-bottom: 12px; }
      .service-price { color: ${primaryColor}; font-weight: 600; }
      .testimonials-section { background: #f9fafb; padding: 60px 20px; }
      .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto; }
      .testimonial-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .testimonial-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e5e7eb; }
      .testimonial-name { font-weight: 600; color: #1f2937; }
      .testimonial-company { font-size: 0.875rem; color: #6b7280; }
      .testimonial-stars { color: #fbbf24; margin-bottom: 8px; }
      .testimonial-text { color: #4b5563; font-style: italic; }
      .cta-section { background: ${primaryColor}; color: white; text-align: center; padding: 60px 20px; }
      .cta-section h2 { font-size: 1.75rem; font-weight: bold; margin-bottom: 1rem; }
      .cta-section p { margin-bottom: 1.5rem; opacity: 0.9; }
      .btn-white { background: white; color: ${primaryColor}; padding: 12px 32px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }
      .contact-section { padding: 60px 20px; }
      .contact-info { display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; max-width: 800px; margin: 0 auto; }
      .contact-item { text-align: center; }
      .contact-label { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
      .contact-value { color: #6b7280; }
      .footer { background: #1f2937; color: white; padding: 40px 20px; text-align: center; }
      .footer-company { font-size: 1.25rem; font-weight: bold; margin-bottom: 8px; }
      .footer-tagline { color: #9ca3af; margin-bottom: 16px; }
      .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
      .footer-links a { color: #9ca3af; text-decoration: none; }
      .footer-copyright { color: #6b7280; font-size: 0.875rem; }
  `;
}

function templateToHtml(data: TemplateData): string {
  if (!data) {
    return '<div style="padding: 40px; text-align: center; color: #6b7280;">Start building your page by adding sections from the left panel.</div>';
  }

  const primaryColor = data.styles?.primaryColor || '#16a34a';
  
  const hero = data.hero || { heading: 'Welcome', subheading: 'Your tagline here', ctaText: 'Get Started' };
  const features = data.features || { heading: 'Our Features', items: [] };
  const services = data.services || { heading: 'Our Services', subheading: '', items: [] };
  const testimonials = data.testimonials || { heading: 'Testimonials', items: [] };
  const cta = data.cta || { heading: 'Ready to Start?', subheading: 'Contact us today', ctaText: 'Contact Us' };
  const contact = data.contact || { phone: '(555) 123-4567', email: 'info@example.com', hours: 'Mon-Fri 9am-5pm' };
  const footer = data.footer || { companyName: 'Company Name', tagline: 'Your tagline', links: [], copyright: '© 2024' };

  const heroSection = `
    <section class="hero">
      <div class="hero-content">
        <h1>${hero.heading || 'Welcome'}</h1>
        <p>${hero.subheading || 'Your tagline here'}</p>
        <a href="#contact" class="btn-primary">${hero.ctaText || 'Get Started'}</a>
      </div>
    </section>
  `;

  const featuresSection = features.items && features.items.length > 0 ? `
    <section class="section">
      <h2 class="section-title">${features.heading || 'Our Features'}</h2>
      <div class="features-grid">
        ${features.items.map(item => `
          <div class="feature-card">
            <div class="feature-icon">${item.icon || '✨'}</div>
            <h3 class="feature-title">${item.title || 'Feature'}</h3>
            <p class="feature-desc">${item.desc || 'Description'}</p>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  const servicesSection = services.items && services.items.length > 0 ? `
    <section class="section" style="background: #f9fafb;">
      <h2 class="section-title">${services.heading || 'Our Services'}</h2>
      ${services.subheading ? `<p class="section-subtitle">${services.subheading}</p>` : ''}
      <div class="services-grid">
        ${services.items.map(item => `
          <div class="service-card">
            <div class="service-image">${item.title || 'Service'}</div>
            <div class="service-content">
              <h3 class="service-title">${item.title || 'Service'}</h3>
              <p class="service-desc">${item.desc || 'Description'}</p>
              <p class="service-price">${item.price || 'Contact for price'}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  const testimonialsSection = testimonials.items && testimonials.items.length > 0 ? `
    <section class="testimonials-section">
      <h2 class="section-title">${testimonials.heading || 'What Our Customers Say'}</h2>
      <div class="testimonials-grid">
        ${testimonials.items.map(item => `
          <div class="testimonial-card">
            <div class="testimonial-header">
              <div class="testimonial-avatar"></div>
              <div>
                <div class="testimonial-name">${item.name || 'Customer'}</div>
                <div class="testimonial-company">${item.company || ''}</div>
              </div>
            </div>
            <div class="testimonial-stars">${'★'.repeat(item.rating || 5)}${'☆'.repeat(5 - (item.rating || 5))}</div>
            <p class="testimonial-text">"${item.text || 'Great service!'}"</p>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  const ctaSection = `
    <section class="cta-section">
      <h2>${cta.heading || 'Ready to Get Started?'}</h2>
      <p>${cta.subheading || 'Contact us today'}</p>
      <button class="btn-white">${cta.ctaText || 'Contact Us'}</button>
    </section>
  `;

  const contactSection = `
    <section class="contact-section" id="contact">
      <h2 class="section-title">Contact Us</h2>
      <div class="contact-info">
        <div class="contact-item">
          <div class="contact-label">Phone</div>
          <div class="contact-value">${contact.phone || '(555) 123-4567'}</div>
        </div>
        <div class="contact-item">
          <div class="contact-label">Email</div>
          <div class="contact-value">${contact.email || 'info@example.com'}</div>
        </div>
        <div class="contact-item">
          <div class="contact-label">Hours</div>
          <div class="contact-value">${contact.hours || 'Mon-Fri 9am-5pm'}</div>
        </div>
      </div>
    </section>
  `;

  const footerSection = `
    <footer class="footer">
      <div class="footer-company">${footer.companyName || 'Company Name'}</div>
      <div class="footer-tagline">${footer.tagline || ''}</div>
      <div class="footer-links">
        ${(footer.links || []).map(link => `<a href="${link.href || '#'}">${link.text || 'Link'}</a>`).join('')}
      </div>
      <div class="footer-copyright">${footer.copyright || '© 2024 All rights reserved.'}</div>
    </footer>
  `;

  return heroSection + featuresSection + servicesSection + testimonialsSection + ctaSection + contactSection + footerSection;
}

interface SectionBlock {
  id: string;
  label: string;
  icon: string;
  category: string;
  content: string;
}

const getSectionBlocks = (primaryColor: string): SectionBlock[] => [
  {
    id: 'hero-section',
    label: 'Hero Section',
    icon: '🎯',
    category: 'Sections',
    content: `
      <section class="hero" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 80px 20px; text-align: center; min-height: 400px;">
        <div style="color: white; max-width: 800px; margin: 0 auto;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">Your Amazing Headline</h1>
          <p style="font-size: 1.25rem; margin-bottom: 1.5rem; opacity: 0.9;">Subheading that explains your value proposition</p>
          <a href="#" style="background: white; color: ${primaryColor}; padding: 12px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">Get Started</a>
        </div>
      </section>
    `
  },
  {
    id: 'features-section',
    label: 'Features Grid',
    icon: '✨',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px;">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #1f2937;">Our Features</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto;">
          <div style="text-align: center; padding: 24px; background: #f3f4f6; border-radius: 12px;">
            <div style="font-size: 2rem; margin-bottom: 12px;">✨</div>
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Feature One</h3>
            <p style="color: #6b7280; font-size: 0.875rem;">Description of this amazing feature</p>
          </div>
          <div style="text-align: center; padding: 24px; background: #f3f4f6; border-radius: 12px;">
            <div style="font-size: 2rem; margin-bottom: 12px;">🚀</div>
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Feature Two</h3>
            <p style="color: #6b7280; font-size: 0.875rem;">Description of this amazing feature</p>
          </div>
          <div style="text-align: center; padding: 24px; background: #f3f4f6; border-radius: 12px;">
            <div style="font-size: 2rem; margin-bottom: 12px;">💡</div>
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Feature Three</h3>
            <p style="color: #6b7280; font-size: 0.875rem;">Description of this amazing feature</p>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'services-section',
    label: 'Services Cards',
    icon: '💼',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px; background: #f9fafb;">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; color: #1f2937;">Our Services</h2>
        <p style="text-align: center; color: #6b7280; margin-bottom: 2rem;">Quality services tailored to your needs</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="width: 100%; height: 180px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af;">Service Image</div>
            <div style="padding: 20px;">
              <h3 style="font-weight: 600; font-size: 1.125rem; color: #1f2937; margin-bottom: 8px;">Service Name</h3>
              <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 12px;">Service description goes here</p>
              <p style="color: ${primaryColor}; font-weight: 600;">From $99</p>
            </div>
          </div>
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="width: 100%; height: 180px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af;">Service Image</div>
            <div style="padding: 20px;">
              <h3 style="font-weight: 600; font-size: 1.125rem; color: #1f2937; margin-bottom: 8px;">Service Name</h3>
              <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 12px;">Service description goes here</p>
              <p style="color: ${primaryColor}; font-weight: 600;">From $149</p>
            </div>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'testimonials-section',
    label: 'Testimonials',
    icon: '💬',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px; background: #f9fafb;">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #1f2937;">What Our Customers Say</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto;">
          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #e5e7eb;"></div>
              <div>
                <div style="font-weight: 600; color: #1f2937;">John Doe</div>
                <div style="font-size: 0.875rem; color: #6b7280;">Customer</div>
              </div>
            </div>
            <div style="color: #fbbf24; margin-bottom: 8px;">★★★★★</div>
            <p style="color: #4b5563; font-style: italic;">"Excellent service! Highly recommended."</p>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'cta-section',
    label: 'Call to Action',
    icon: '📣',
    category: 'Sections',
    content: `
      <section style="background: ${primaryColor}; color: white; text-align: center; padding: 60px 20px;">
        <h2 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 1rem;">Ready to Get Started?</h2>
        <p style="margin-bottom: 1.5rem; opacity: 0.9;">Contact us today for a free consultation</p>
        <button style="background: white; color: ${primaryColor}; padding: 12px 32px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;">Contact Us</button>
      </section>
    `
  },
  {
    id: 'contact-section',
    label: 'Contact Info',
    icon: '📞',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px;" id="contact">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #1f2937;">Contact Us</h2>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Phone</div>
            <div style="color: #6b7280;">(555) 123-4567</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Email</div>
            <div style="color: #6b7280;">info@example.com</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Hours</div>
            <div style="color: #6b7280;">Mon-Fri 9am-5pm</div>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'footer-section',
    label: 'Footer',
    icon: '📋',
    category: 'Sections',
    content: `
      <footer style="background: #1f2937; color: white; padding: 40px 20px; text-align: center;">
        <div style="font-size: 1.25rem; font-weight: bold; margin-bottom: 8px;">Company Name</div>
        <div style="color: #9ca3af; margin-bottom: 16px;">Your tagline here</div>
        <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 16px;">
          <a href="#" style="color: #9ca3af; text-decoration: none;">Home</a>
          <a href="#" style="color: #9ca3af; text-decoration: none;">Services</a>
          <a href="#" style="color: #9ca3af; text-decoration: none;">Contact</a>
        </div>
        <div style="color: #6b7280; font-size: 0.875rem;">© 2024 Company Name. All rights reserved.</div>
      </footer>
    `
  },
  {
    id: 'text-block',
    label: 'Text Block',
    icon: '📝',
    category: 'Basic',
    content: `<div style="padding: 20px;"><p style="color: #374151; line-height: 1.6;">Add your text content here. Click to edit this paragraph and add your own content. You can describe your services, tell your story, or share important information with your visitors.</p></div>`
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: '🔤',
    category: 'Basic',
    content: `<h2 style="font-size: 1.75rem; font-weight: bold; color: #1f2937; padding: 20px; text-align: center;">Section Heading</h2>`
  },
  {
    id: 'button',
    label: 'Button',
    icon: '🔘',
    category: 'Basic',
    content: `<div style="padding: 20px; text-align: center;"><a href="#contact" style="display: inline-block; background: ${primaryColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem;">Get Started Today</a></div>`
  },
  {
    id: 'image',
    label: 'Image',
    icon: '🖼️',
    category: 'Basic',
    content: `<div style="padding: 20px;"><img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop" alt="Professional workspace" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`
  },
  {
    id: 'video',
    label: 'Video',
    icon: '🎬',
    category: 'Basic',
    content: `<div style="padding: 20px;"><div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>`
  },
  {
    id: 'map',
    label: 'Map',
    icon: '🗺️',
    category: 'Basic',
    content: `<div style="padding: 20px;"><div style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.30596073366!2d-74.25986548248684!3d40.69714941932609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1702134567890!5m2!1sen!2s" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>`
  },
  {
    id: 'social-links',
    label: 'Social Links',
    icon: '🔗',
    category: 'Basic',
    content: `<div style="padding: 20px; text-align: center;"><div style="display: flex; justify-content: center; gap: 16px;"><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #1877f2; color: white; border-radius: 50%; text-decoration: none; font-size: 1.25rem;">f</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #1da1f2; color: white; border-radius: 50%; text-decoration: none; font-size: 1.25rem;">𝕏</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; border-radius: 50%; text-decoration: none; font-size: 1.25rem;">📷</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #0077b5; color: white; border-radius: 50%; text-decoration: none; font-size: 1.25rem;">in</a></div></div>`
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: '💬',
    category: 'Basic',
    content: `<div style="padding: 40px 20px; background: #f9fafb; border-left: 4px solid ${primaryColor};"><blockquote style="max-width: 600px; margin: 0 auto;"><p style="font-size: 1.25rem; color: #374151; font-style: italic; line-height: 1.8; margin-bottom: 16px;">"Quality is not an act, it is a habit. We strive for excellence in everything we do."</p><cite style="color: #6b7280; font-size: 0.875rem;">— Company Founder</cite></blockquote></div>`
  },
  {
    id: 'spacer',
    label: 'Spacer',
    icon: '↕️',
    category: 'Layout',
    content: '<div style="height: 60px;"></div>'
  },
  {
    id: 'divider',
    label: 'Divider',
    icon: '➖',
    category: 'Layout',
    content: '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 40px auto; max-width: 800px;">'
  },
  {
    id: 'two-columns',
    label: 'Two Columns',
    icon: '▥',
    category: 'Layout',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px; max-width: 1200px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; min-height: 150px;"><h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Column 1</h3><p style="color: #6b7280;">Add your content here</p></div>
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; min-height: 150px;"><h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Column 2</h3><p style="color: #6b7280;">Add your content here</p></div>
      </div>
    `
  },
  {
    id: 'three-columns',
    label: 'Three Columns',
    icon: '▦',
    category: 'Layout',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; padding: 20px; max-width: 1200px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; min-height: 150px;"><h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Column 1</h3><p style="color: #6b7280;">Add content</p></div>
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; min-height: 150px;"><h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Column 2</h3><p style="color: #6b7280;">Add content</p></div>
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; min-height: 150px;"><h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Column 3</h3><p style="color: #6b7280;">Add content</p></div>
      </div>
    `
  },
  {
    id: 'pricing-table',
    label: 'Pricing',
    icon: '💰',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px; background: #f9fafb;">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; color: #1f2937;">Our Pricing</h2>
        <p style="text-align: center; color: #6b7280; margin-bottom: 2rem;">Choose the plan that's right for you</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
            <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Basic</h3>
            <div style="font-size: 2.5rem; font-weight: bold; color: ${primaryColor}; margin-bottom: 16px;">$29<span style="font-size: 1rem; color: #6b7280;">/mo</span></div>
            <ul style="list-style: none; padding: 0; margin-bottom: 24px; color: #4b5563;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Feature One</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Feature Two</li>
              <li style="padding: 8px 0;">✓ Feature Three</li>
            </ul>
            <a href="#" style="display: block; background: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>
          </div>
          <div style="background: ${primaryColor}; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; transform: scale(1.05);">
            <div style="background: white; color: ${primaryColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-block; margin-bottom: 12px;">POPULAR</div>
            <h3 style="font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 8px;">Pro</h3>
            <div style="font-size: 2.5rem; font-weight: bold; color: white; margin-bottom: 16px;">$79<span style="font-size: 1rem; opacity: 0.8;">/mo</span></div>
            <ul style="list-style: none; padding: 0; margin-bottom: 24px; color: white;">
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">✓ Everything in Basic</li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">✓ Priority Support</li>
              <li style="padding: 8px 0;">✓ Advanced Features</li>
            </ul>
            <a href="#" style="display: block; background: white; color: ${primaryColor}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'faq-section',
    label: 'FAQ',
    icon: '❓',
    category: 'Sections',
    content: `
      <section style="padding: 60px 20px;">
        <h2 style="font-size: 1.75rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #1f2937;">Frequently Asked Questions</h2>
        <div style="max-width: 700px; margin: 0 auto;">
          <div style="border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">What services do you offer?</h3>
            <p style="color: #6b7280; line-height: 1.6;">We offer a comprehensive range of services tailored to meet your needs. Contact us to learn more about how we can help you.</p>
          </div>
          <div style="border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">How can I get started?</h3>
            <p style="color: #6b7280; line-height: 1.6;">Getting started is easy! Simply contact us through our form or give us a call, and we'll guide you through the process.</p>
          </div>
          <div style="padding: 20px 0;">
            <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">What are your hours of operation?</h3>
            <p style="color: #6b7280; line-height: 1.6;">We're available Monday through Friday, 9am to 5pm. For urgent matters, please leave a message and we'll get back to you promptly.</p>
          </div>
        </div>
      </section>
    `
  }
];

export default function DragDropBuilder({ templateData, onUpdate, onSave }: DragDropBuilderProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'layers'>('blocks');
  const [activeDevice, setActiveDevice] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  const primaryColor = templateData.styles?.primaryColor || '#16a34a';
  const sectionBlocks = getSectionBlocks(primaryColor);

  const handleUpdate = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.getHtml() || '';
    const css = editorRef.current.getCss() || '';
    onUpdate(html, css);
  }, [onUpdate]);

  const addBlock = useCallback((block: SectionBlock) => {
    if (!editorRef.current) return;
    editorRef.current.addComponents(block.content);
    handleUpdate();
  }, [handleUpdate]);

  const deleteSelected = useCallback(() => {
    if (!editorRef.current) return;
    const selected = editorRef.current.getSelected();
    if (selected) {
      selected.remove();
      handleUpdate();
    }
  }, [handleUpdate]);

  const duplicateSelected = useCallback(() => {
    if (!editorRef.current) return;
    const selected = editorRef.current.getSelected();
    if (selected) {
      const clone = selected.clone();
      selected.parent()?.append(clone, { at: selected.index() + 1 });
      handleUpdate();
    }
  }, [handleUpdate]);

  const moveUp = useCallback(() => {
    if (!editorRef.current) return;
    const selected = editorRef.current.getSelected();
    if (selected && selected.index() > 0) {
      selected.move(selected.parent()!, { at: selected.index() - 1 });
      handleUpdate();
    }
  }, [handleUpdate]);

  const moveDown = useCallback(() => {
    if (!editorRef.current) return;
    const selected = editorRef.current.getSelected();
    if (selected) {
      const parent = selected.parent();
      if (parent && selected.index() < parent.components().length - 1) {
        selected.move(parent, { at: selected.index() + 2 });
        handleUpdate();
      }
    }
  }, [handleUpdate]);

  const setDevice = useCallback((device: 'Desktop' | 'Tablet' | 'Mobile') => {
    if (!editorRef.current) return;
    editorRef.current.setDevice(device);
    setActiveDevice(device);
  }, []);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Use rawHtml if available (from previous edits), otherwise generate from template data
    const initialHtml = templateData.rawHtml || templateToHtml(templateData);
    // Use rawCss if available, otherwise generate default template CSS
    const initialCss = templateData.rawCss || getTemplateCss(templateData);
    
    console.log('🔨 DragDropBuilder initializing with:', {
      hasRawHtml: !!templateData.rawHtml,
      hasRawCss: !!templateData.rawCss,
      htmlLength: initialHtml.length,
      cssLength: initialCss.length,
      htmlPreview: initialHtml.substring(0, 200),
      templateData: templateData
    });

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: '100%',
      fromElement: false,
      storageManager: false,
      telemetry: false,
      plugins: [],
      canvas: {
        styles: [],
        scripts: [],
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '320px', widthMedia: '480px' },
        ]
      },
      panels: { defaults: [] },
      blockManager: { blocks: [] },
      protectedCss: '',
      noticeOnUnload: false,
    });

    // Enable dragging and selection
    editor.on('load', () => {
      const canvas = editor.Canvas;
      if (canvas && canvas.getDocument()) {
        const body = canvas.getBody();
        if (body) {
          body.style.backgroundColor = 'white';
          body.style.margin = '0';
          body.style.padding = '0';
          body.style.pointerEvents = 'auto';
        }
      }
    });

    editor.setComponents(initialHtml);
    editor.setStyle(initialCss);
    editorRef.current = editor;
    
    console.log('🔨 GrapesJS editor initialized, components count:', editor.getComponents().length);

    // Ensure dragging is enabled
    const sm = editor.SelectorManager;
    if (sm) {
      sm.addSelector('*', { label: '*' });
    }

    // Force canvas refresh after a short delay to ensure rendering
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.refresh();
        const canvas = editorRef.current.Canvas;
        if (canvas) {
          const frames = canvas.getFrames();
          console.log('🔨 Canvas frames:', frames.length);
        }
        console.log('🔨 Canvas refreshed');
      }
    }, 100);

    editor.on('component:update', handleUpdate);
    editor.on('component:add', handleUpdate);
    editor.on('component:remove', handleUpdate);
    editor.on('style:property:update', handleUpdate);

    editor.on('component:selected', (component: any) => {
      setSelectedComponent(component);
    });

    editor.on('component:deselected', () => {
      setSelectedComponent(null);
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [templateData, handleUpdate]);

  const groupedBlocks = sectionBlocks.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, SectionBlock[]>);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Visual Builder</span>
          <div className="flex gap-1 ml-4 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setDevice('Desktop')}
              className={`p-1.5 rounded ${activeDevice === 'Desktop' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('Tablet')}
              className={`p-1.5 rounded ${activeDevice === 'Tablet' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('Mobile')}
              className={`p-1.5 rounded ${activeDevice === 'Mobile' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          {selectedComponent && (
            <div className="flex gap-1 ml-4 bg-gray-700 rounded-lg p-1">
              <button
                onClick={moveUp}
                className="p-1.5 rounded hover:bg-gray-600"
                title="Move Up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={moveDown}
                className="p-1.5 rounded hover:bg-gray-600"
                title="Move Down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={duplicateSelected}
                className="p-1.5 rounded hover:bg-gray-600"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={deleteSelected}
                className="p-1.5 rounded hover:bg-red-600 text-red-400 hover:text-white"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-700">
            <button 
              onClick={() => setActiveTab('blocks')}
              className={`flex-1 px-3 py-2 text-sm flex items-center justify-center gap-1 ${
                activeTab === 'blocks' 
                  ? 'text-white bg-gray-700 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Sections
            </button>
            <button 
              onClick={() => setActiveTab('layers')}
              className={`flex-1 px-3 py-2 text-sm flex items-center justify-center gap-1 ${
                activeTab === 'layers' 
                  ? 'text-white bg-gray-700 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Layers
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'blocks' && (
              <div className="space-y-4">
                {Object.entries(groupedBlocks).map(([category, blocks]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {blocks.map((block) => (
                        <button
                          key={block.id}
                          onClick={() => addBlock(block)}
                          className="flex flex-col items-center justify-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-blue-500 transition-all text-center"
                          title={`Add ${block.label}`}
                        >
                          <span className="text-xl mb-1">{block.icon}</span>
                          <span className="text-xs text-gray-300">{block.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'layers' && (
              <div className="text-gray-400 text-sm p-2">
                <p className="mb-2">Click on elements in the canvas to select them.</p>
                <p className="text-xs text-gray-500">Use the toolbar buttons to move, duplicate, or delete selected elements.</p>
              </div>
            )}
          </div>
        </div>
        
        <div
          ref={containerRef}
          className="flex-1 bg-white gjs-editor-container"
          style={{ minHeight: '500px', height: '100%', width: '100%', position: 'relative' }}
        />
        
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
          <div className="px-3 py-2 text-sm text-white bg-gray-700 border-b border-gray-600">
            {selectedComponent ? 'Element Selected' : 'No Selection'}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {selectedComponent ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={moveUp}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      <ArrowUp className="w-3 h-3" /> Move Up
                    </button>
                    <button
                      onClick={moveDown}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      <ArrowDown className="w-3 h-3" /> Move Down
                    </button>
                    <button
                      onClick={duplicateSelected}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Click directly on text in the canvas to edit it.</p>
                  <p className="mt-1">Drag sections from the left panel to add new content.</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                <p className="mb-3">Select an element in the canvas to see options.</p>
                <p className="text-xs text-gray-500">Click on any section or element to select it. You can then move, duplicate, or delete it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
