import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Eye, X, Save, Palette, Type, Layout } from 'lucide-react';
import { TemplateData } from '../utils/savedWebsites';

interface Section {
  id: string;
  type: 'navigation' | 'hero' | 'features' | 'services' | 'testimonials' | 'team' | 'faq' | 'pricing' | 'gallery' | 'blog' | 'partners' | 'cta' | 'contact' | 'about' | 'policies' | 'footer' | 'form' | 'popup';
  name: string;
  data: any;
}

interface SectionsEditorProps {
  templateData: TemplateData;
  onUpdate: (html: string, css: string) => void;
  onSave: () => void;
}

function generateSectionHtml(section: Section): string {
  const bgColor = section.data.bgColor || 'white';
  const bgClass = bgColor === 'white' ? '#ffffff' : 
    bgColor === 'gray-50' ? '#f9fafb' :
    bgColor === 'gray-100' ? '#f3f4f6' :
    bgColor === 'blue-50' ? '#eff6ff' :
    bgColor === 'green-50' ? '#f0fdf4' :
    bgColor === 'purple-50' ? '#faf5ff' : '#ffffff';

  const imageUrl = section.data.imageUrl;
  const hasImage = imageUrl && imageUrl.trim() !== '';
  const heroBackground = hasImage 
    ? `background: linear-gradient(rgba(99, 102, 241, 0.85), rgba(139, 92, 246, 0.9)), url('${imageUrl}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);`;
  const textColor = hasImage || !section.data.bgColor ? '#ffffff' : '#1f2937';
  const subtextColor = hasImage || !section.data.bgColor ? 'rgba(255,255,255,0.9)' : '#6b7280';

  switch (section.type) {
    case 'navigation':
      const navLinks = section.data.links || [
        { text: 'Home', url: '#' },
        { text: 'Services', url: '#services' },
        { text: 'About', url: '#about' },
        { text: 'Contact', url: '#contact' }
      ];
      return `
        <nav style="background: white; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <style>
            .nav-mobile-menu { display: none; }
            .nav-mobile-menu.active { display: block; }
            .nav-hamburger { display: none; cursor: pointer; padding: 8px; }
            @media (max-width: 768px) {
              .nav-desktop { display: none !important; }
              .nav-hamburger { display: flex; flex-direction: column; gap: 4px; }
              .nav-hamburger span { display: block; width: 20px; height: 2px; background: #374151; }
              .nav-mobile-menu { position: absolute; top: 100%; left: 0; right: 0; background: white; border-bottom: 1px solid #e5e7eb; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .nav-mobile-menu a { display: block; padding: 12px 16px; color: #4b5563; text-decoration: none; border-radius: 8px; }
              .nav-mobile-menu a:hover { background: #f3f4f6; }
            }
          </style>
          <div style="max-width: 1200px; margin: 0 auto; padding: 16px 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 1.25rem; font-weight: bold; color: #111827;">${section.data.logo || 'Company'}</span>
              <div class="nav-desktop" style="display: flex; align-items: center; gap: 24px;">
                ${navLinks.map((link: any) => `<a href="${link.url}" style="color: #4b5563; text-decoration: none; font-weight: 500;">${link.text}</a>`).join('')}
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <a href="${section.data.ctaUrl || '#contact'}" style="background: #2563eb; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 500; text-decoration: none; font-size: 14px;">${section.data.ctaText || 'Get Started'}</a>
                <div class="nav-hamburger" onclick="document.querySelector('.nav-mobile-menu').classList.toggle('active')">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
          <div class="nav-mobile-menu">
            ${navLinks.map((link: any) => `<a href="${link.url}">${link.text}</a>`).join('')}
          </div>
        </nav>`;

    case 'hero':
      return `
        <section class="section-hero" style="${heroBackground} padding: 80px 20px; text-align: center; min-height: 400px; display: flex; align-items: center; justify-content: center;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 20px; color: ${textColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${section.data.heading || 'Welcome to Our Site'}
            </h1>
            ${section.data.subheading ? `<p style="font-size: 1.25rem; color: ${subtextColor}; margin-bottom: 30px;">${section.data.subheading}</p>` : ''}
            ${section.data.description ? `<p style="font-size: 1rem; color: ${subtextColor}; max-width: 600px; margin: 0 auto 30px;">${section.data.description}</p>` : ''}
            <button style="background-color: #ffffff; color: #6366f1; padding: 12px 32px; border-radius: 8px; font-size: 1rem; border: none; cursor: pointer; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${section.data.ctaText || 'Get Started'}
            </button>
          </div>
        </section>`;

    case 'features':
      const features = section.data.items || [
        { title: 'Feature 1', description: 'Description of feature 1' },
        { title: 'Feature 2', description: 'Description of feature 2' },
        { title: 'Feature 3', description: 'Description of feature 3' }
      ];
      return `
        <section class="section-features" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Our Features'}
            </h2>
            ${section.data.subheading ? `<p style="text-align: center; color: #6b7280; margin-bottom: 40px;">${section.data.subheading}</p>` : ''}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
              ${features.map((f: any) => `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px; color: #1f2937;">${f.title || 'Feature'}</h3>
                  <p style="color: #6b7280; line-height: 1.6;">${f.description || 'Feature description'}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'services':
      const services = section.data.items || [
        { title: 'Service 1', description: 'Description of service 1' },
        { title: 'Service 2', description: 'Description of service 2' },
        { title: 'Service 3', description: 'Description of service 3' }
      ];
      return `
        <section class="section-services" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 20px; color: #1f2937;">
              ${section.data.heading || 'Our Services'}
            </h2>
            ${section.data.subheading ? `<p style="text-align: center; color: #6b7280; margin-bottom: 40px;">${section.data.subheading}</p>` : ''}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
              ${services.map((s: any) => `
                <div style="background: white; padding: 25px; border-radius: 10px; border: 1px solid #e5e7eb;">
                  <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 10px; color: #1f2937;">${s.title || 'Service'}</h3>
                  <p style="color: #6b7280; font-size: 0.95rem;">${s.description || 'Service description'}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'testimonials':
      const testimonials = section.data.items || [
        { quote: 'Great service!', author: 'John Doe' },
        { quote: 'Highly recommended!', author: 'Jane Smith' }
      ];
      return `
        <section class="section-testimonials" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'What Our Clients Say'}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
              ${testimonials.map((t: any) => `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                  <p style="font-style: italic; color: #4b5563; margin-bottom: 15px; line-height: 1.6;">"${t.quote || 'Great experience!'}"</p>
                  <p style="font-weight: 600; color: #1f2937;">- ${t.author || 'Happy Customer'}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'cta':
      return `
        <section class="section-cta" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 60px 20px; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; color: white; margin-bottom: 15px;">
              ${section.data.heading || 'Ready to Get Started?'}
            </h2>
            <p style="color: rgba(255,255,255,0.9); margin-bottom: 25px; font-size: 1.1rem;">
              ${section.data.text || section.data.subheading || 'Contact us today to learn more about our services.'}
            </p>
            <button style="background: white; color: #3b82f6; padding: 14px 36px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 1rem;">
              Contact Us
            </button>
          </div>
        </section>`;

    case 'contact':
      return `
        <section class="section-contact" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 30px; color: #1f2937;">
              ${section.data.heading || 'Contact Us'}
            </h2>
            <form style="display: flex; flex-direction: column; gap: 20px;">
              <input type="text" placeholder="Your Name" style="padding: 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;" />
              <input type="email" placeholder="Your Email" style="padding: 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;" />
              <textarea placeholder="Your Message" rows="4" style="padding: 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
              <button type="submit" style="background: #3b82f6; color: white; padding: 14px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 1rem;">
                Send Message
              </button>
            </form>
          </div>
        </section>`;

    case 'about':
      return `
        <section class="section-about" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 900px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 20px; color: #1f2937;">
              ${section.data.heading || 'About Us'}
            </h2>
            <p style="color: #4b5563; line-height: 1.8; font-size: 1.1rem;">
              ${section.data.description || section.data.text || 'We are dedicated to providing the best service to our customers. Our team of experts is here to help you succeed.'}
            </p>
          </div>
        </section>`;

    case 'faq':
      const faqs = section.data.items || [
        { question: 'How does it work?', answer: 'It works seamlessly with your existing setup.' },
        { question: 'What is the pricing?', answer: 'Contact us for a personalized quote.' }
      ];
      return `
        <section class="section-faq" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Frequently Asked Questions'}
            </h2>
            <div style="display: flex; flex-direction: column; gap: 20px;">
              ${faqs.map((faq: any) => `
                <div style="background: white; padding: 25px; border-radius: 10px; border: 1px solid #e5e7eb;">
                  <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 10px;">${faq.question}</h3>
                  <p style="color: #6b7280; line-height: 1.6;">${faq.answer}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'pricing':
      const plans = section.data.items || [
        { name: 'Basic', price: '$29/mo', features: ['Feature 1', 'Feature 2'] },
        { name: 'Pro', price: '$79/mo', features: ['All Basic features', 'Feature 3', 'Feature 4'] }
      ];
      return `
        <section class="section-pricing" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1000px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Pricing Plans'}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px;">
              ${plans.map((plan: any) => `
                <div style="background: white; padding: 35px; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                  <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 10px; color: #1f2937;">${plan.name}</h3>
                  <p style="font-size: 2rem; font-weight: bold; color: #3b82f6; margin-bottom: 20px;">${plan.price}</p>
                  <ul style="list-style: none; padding: 0; margin-bottom: 25px;">
                    ${(plan.features || []).map((f: string) => `<li style="padding: 8px 0; color: #6b7280;">${f}</li>`).join('')}
                  </ul>
                  <button style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500;">
                    Get Started
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'team':
      const members = section.data.items || [
        { name: 'John Doe', role: 'CEO' },
        { name: 'Jane Smith', role: 'CTO' }
      ];
      return `
        <section class="section-team" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1000px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Meet Our Team'}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px;">
              ${members.map((m: any) => `
                <div style="text-align: center;">
                  <div style="width: 120px; height: 120px; background: #e5e7eb; border-radius: 50%; margin: 0 auto 15px;"></div>
                  <h3 style="font-weight: 600; color: #1f2937;">${m.name}</h3>
                  <p style="color: #6b7280; font-size: 0.9rem;">${m.role}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'gallery':
      return `
        <section class="section-gallery" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Gallery'}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
              <div style="background: #e5e7eb; height: 200px; border-radius: 10px;"></div>
              <div style="background: #e5e7eb; height: 200px; border-radius: 10px;"></div>
              <div style="background: #e5e7eb; height: 200px; border-radius: 10px;"></div>
              <div style="background: #e5e7eb; height: 200px; border-radius: 10px;"></div>
            </div>
          </div>
        </section>`;

    case 'partners':
      return `
        <section class="section-partners" style="background-color: ${bgClass}; padding: 50px 20px;">
          <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 30px; color: #6b7280;">
              ${section.data.heading || 'Trusted By'}
            </h2>
            <div style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap;">
              <div style="background: #e5e7eb; width: 120px; height: 50px; border-radius: 6px;"></div>
              <div style="background: #e5e7eb; width: 120px; height: 50px; border-radius: 6px;"></div>
              <div style="background: #e5e7eb; width: 120px; height: 50px; border-radius: 6px;"></div>
              <div style="background: #e5e7eb; width: 120px; height: 50px; border-radius: 6px;"></div>
            </div>
          </div>
        </section>`;

    case 'blog':
      const posts = section.data.items || [
        { title: 'Blog Post 1', excerpt: 'Lorem ipsum dolor sit amet...' },
        { title: 'Blog Post 2', excerpt: 'Consectetur adipiscing elit...' }
      ];
      return `
        <section class="section-blog" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 1000px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Latest Posts'}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
              ${posts.map((post: any) => `
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                  <div style="background: #e5e7eb; height: 180px;"></div>
                  <div style="padding: 20px;">
                    <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 10px;">${post.title}</h3>
                    <p style="color: #6b7280; font-size: 0.95rem;">${post.excerpt}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'form':
      return `
        <section class="section-form" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 15px; color: #1f2937;">
              ${section.data.heading || 'Get a Free Quote'}
            </h2>
            <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
              ${section.data.subheading || 'Fill out the form below and we\'ll get back to you within 24 hours.'}
            </p>
            <form style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px; color: #374151;">Full Name *</label>
                <input type="text" placeholder="John Doe" required style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
              </div>
              <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px; color: #374151;">Email Address *</label>
                <input type="email" placeholder="john@example.com" required style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
              </div>
              <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px; color: #374151;">Phone Number</label>
                <input type="tel" placeholder="(555) 123-4567" style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
              </div>
              <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 500; margin-bottom: 6px; color: #374151;">Message</label>
                <textarea rows="4" placeholder="Tell us about your project..." style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
              </div>
              <button type="submit" style="width: 100%; background: #3b82f6; color: white; padding: 14px 24px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                ${section.data.buttonText || 'Submit Request'}
              </button>
              <p style="text-align: center; font-size: 0.85rem; color: #9ca3af; margin-top: 15px;">
                By submitting, you agree to our Privacy Policy.
              </p>
            </form>
          </div>
        </section>`;

    case 'policies':
      const policies = section.data.items || [
        { title: 'Privacy Policy', content: 'We respect your privacy and are committed to protecting your personal information. This policy outlines how we collect, use, and safeguard your data.' },
        { title: 'Terms of Service', content: 'By using our services, you agree to these terms. We reserve the right to modify these terms at any time.' },
        { title: 'Refund Policy', content: 'We offer a 30-day money-back guarantee on all our services. Contact us for refund requests.' }
      ];
      return `
        <section class="section-policies" style="background-color: ${bgClass}; padding: 60px 20px;">
          <div style="max-width: 900px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 40px; color: #1f2937;">
              ${section.data.heading || 'Our Policies'}
            </h2>
            <div style="display: flex; flex-direction: column; gap: 30px;">
              ${policies.map((policy: any) => `
                <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">
                  <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 15px; color: #1f2937; display: flex; align-items: center; gap: 10px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span>
                    ${policy.title}
                  </h3>
                  <p style="color: #6b7280; line-height: 1.7;">${policy.content}</p>
                  ${policy.link ? `<a href="${policy.link}" style="color: #3b82f6; text-decoration: underline; margin-top: 10px; display: inline-block;">Read Full Policy</a>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </section>`;

    case 'footer':
      const footerLinks = section.data.links || [
        { text: 'Home', url: '#' },
        { text: 'Services', url: '#services' },
        { text: 'About', url: '#about' },
        { text: 'Contact', url: '#contact' },
        { text: 'Privacy Policy', url: '#privacy' },
        { text: 'Terms of Service', url: '#terms' }
      ];
      return `
        <footer class="section-footer" style="background-color: #1f2937; color: white; padding: 50px 20px 30px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 15px;">
                  ${section.data.companyName || 'Company Name'}
                </h3>
                <p style="color: #9ca3af; font-size: 0.95rem; line-height: 1.6;">
                  ${section.data.description || 'Your trusted partner for quality services. Available 24/7 to serve you.'}
                </p>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 15px;">Quick Links</h4>
                <ul style="list-style: none; padding: 0;">
                  ${footerLinks.slice(0, 4).map((link: any) => `
                    <li style="margin-bottom: 10px;">
                      <a href="${link.url}" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">${link.text}</a>
                    </li>
                  `).join('')}
                </ul>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 15px;">Legal</h4>
                <ul style="list-style: none; padding: 0;">
                  ${footerLinks.slice(4).map((link: any) => `
                    <li style="margin-bottom: 10px;">
                      <a href="${link.url}" style="color: #9ca3af; text-decoration: none;">${link.text}</a>
                    </li>
                  `).join('')}
                </ul>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 15px;">Contact</h4>
                <p style="color: #9ca3af; margin-bottom: 8px;">${section.data.phone || '+1 (800) 123-4567'}</p>
                <p style="color: #9ca3af; margin-bottom: 8px;">${section.data.email || 'info@example.com'}</p>
                <p style="color: #9ca3af;">${section.data.address || '123 Main St, City, State'}</p>
              </div>
            </div>
            <div style="border-top: 1px solid #374151; padding-top: 25px; text-align: center;">
              <p style="color: #9ca3af; font-size: 0.9rem;">
                © ${new Date().getFullYear()} ${section.data.companyName || 'Company Name'}. All rights reserved.
              </p>
              ${section.data.disclaimer ? `<p style="color: #6b7280; font-size: 0.8rem; margin-top: 10px;">${section.data.disclaimer}</p>` : ''}
            </div>
          </div>
        </footer>`;

    case 'popup':
      return `
        <div class="section-popup" id="popup-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; justify-content: center; align-items: center;">
          <div style="background: white; max-width: 500px; width: 90%; border-radius: 16px; overflow: hidden; position: relative; animation: popupSlide 0.3s ease-out;">
            <button onclick="document.getElementById('popup-modal').style.display='none'" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            <div style="padding: 40px;">
              <h2 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 15px; color: #1f2937; text-align: center;">
                ${section.data.heading || 'Special Offer!'}
              </h2>
              <p style="color: #6b7280; text-align: center; margin-bottom: 25px;">
                ${section.data.text || 'Get 20% off your first order. Limited time only!'}
              </p>
              <form style="display: flex; flex-direction: column; gap: 15px;">
                <input type="email" placeholder="Enter your email" style="padding: 14px 18px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
                <button type="submit" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 14px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  ${section.data.buttonText || 'Claim Offer'}
                </button>
              </form>
              <p style="text-align: center; font-size: 0.8rem; color: #9ca3af; margin-top: 15px;">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
        <script>
          setTimeout(function() {
            var popup = document.getElementById('popup-modal');
            if (popup && !sessionStorage.getItem('popupShown')) {
              popup.style.display = 'flex';
              sessionStorage.setItem('popupShown', 'true');
            }
          }, ${section.data.delay || 3000});
        </script>
        <style>
          @keyframes popupSlide {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>`;

    default:
      return `
        <section style="background-color: ${bgClass}; padding: 40px 20px; text-align: center;">
          <p style="color: #6b7280;">${section.name} section</p>
        </section>`;
  }
}

function generateCss(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.5; color: #1f2937; }
    img { max-width: 100%; height: auto; }
    button { cursor: pointer; transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    input, textarea { font-family: inherit; }
    input:focus, textarea:focus { outline: 2px solid #3b82f6; border-color: #3b82f6; }
  `;
}

const SECTION_TYPES = [
  { type: 'navigation', name: 'Navigation', color: 'bg-teal-50', icon: '🧭' },
  { type: 'hero', name: 'Hero Section', color: 'bg-blue-50', icon: '🎯' },
  { type: 'features', name: 'Features', color: 'bg-indigo-50', icon: '⭐' },
  { type: 'services', name: 'Services', color: 'bg-purple-50', icon: '🔧' },
  { type: 'testimonials', name: 'Testimonials', color: 'bg-yellow-50', icon: '💬' },
  { type: 'team', name: 'Team', color: 'bg-pink-50', icon: '👥' },
  { type: 'faq', name: 'FAQ', color: 'bg-orange-50', icon: '❓' },
  { type: 'pricing', name: 'Pricing', color: 'bg-red-50', icon: '💰' },
  { type: 'gallery', name: 'Gallery', color: 'bg-indigo-50', icon: '🖼️' },
  { type: 'blog', name: 'Blog', color: 'bg-cyan-50', icon: '📝' },
  { type: 'partners', name: 'Partners', color: 'bg-lime-50', icon: '🤝' },
  { type: 'cta', name: 'Call to Action', color: 'bg-amber-50', icon: '🚀' },
  { type: 'contact', name: 'Contact', color: 'bg-indigo-50', icon: '📧' },
  { type: 'about', name: 'About Us', color: 'bg-fuchsia-50', icon: '📖' },
  { type: 'form', name: 'Lead Form', color: 'bg-rose-50', icon: '📋' },
  { type: 'policies', name: 'Policies', color: 'bg-slate-50', icon: '📜' },
  { type: 'footer', name: 'Footer', color: 'bg-gray-100', icon: '🔻' },
  { type: 'popup', name: 'Popup/Modal', color: 'bg-violet-50', icon: '💡' },
];

export default function SectionsEditor({ templateData, onUpdate, onSave }: SectionsEditorProps) {
  const [sections, setSections] = useState<Section[]>(buildSectionsFromTemplate(templateData));
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [preview, setPreview] = useState(true);

  const generateFullHtml = useCallback((sects: Section[]) => {
    const html = sects.map(s => generateSectionHtml(s)).join('\n');
    const css = generateCss();
    return { html, css };
  }, []);

  useEffect(() => {
    const { html, css } = generateFullHtml(sections);
    onUpdate(html, css);
  }, [sections, generateFullHtml, onUpdate]);

  function buildSectionsFromTemplate(data: TemplateData): Section[] {
    const sects: Section[] = [];
    
    if (data.hero) {
      sects.push({
        id: 'hero',
        type: 'hero',
        name: 'Hero',
        data: { ...data.hero, imageUrl: data.hero_image }
      });
    }
    
    if (data.features) {
      sects.push({
        id: 'features',
        type: 'features',
        name: 'Features',
        data: data.features
      });
    }
    
    if (data.services) {
      sects.push({
        id: 'services',
        type: 'services',
        name: 'Services',
        data: data.services
      });
    }
    
    if (data.testimonials) {
      sects.push({
        id: 'testimonials',
        type: 'testimonials',
        name: 'Testimonials',
        data: data.testimonials
      });
    }
    
    if (data.cta) {
      sects.push({
        id: 'cta',
        type: 'cta',
        name: 'CTA',
        data: data.cta
      });
    }
    
    if (data.contact) {
      sects.push({
        id: 'contact',
        type: 'contact',
        name: 'Contact',
        data: data.contact
      });
    }

    return sects;
  }

  const addSection = (type: string) => {
    const newSection: Section = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      name: SECTION_TYPES.find(s => s.type === type)?.name || type,
      data: {}
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, data: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, data } : s));
  };

  const renderSectionPreview = (section: Section) => {
    const sectionType = SECTION_TYPES.find(s => s.type === section.type);
    const bgColor = sectionType?.color || 'bg-gray-50';
    
    return (
      <div key={section.id} className={`${bgColor} p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sectionType?.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{section.name}</h3>
              <p className="text-xs text-gray-600">{section.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingSection(section)}
              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeSection(section.id)}
              className="p-2 hover:bg-white rounded-lg transition-colors text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {section.data.heading && (
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">{section.data.heading}</h4>
            {section.data.subheading && (
              <p className="text-sm text-gray-600">{section.data.subheading}</p>
            )}
          </div>
        )}
        
        {section.data.items && (
          <div className="text-xs text-gray-600">
            {section.data.items.length} items
          </div>
        )}
      </div>
    );
  };

  const renderEditor = () => {
    if (!editingSection) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Edit {editingSection.name}</h2>
            <button
              onClick={() => setEditingSection(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Heading */}
            <div>
              <label className="block text-sm font-medium mb-1">Section Heading</label>
              <input
                type="text"
                value={editingSection.data.heading || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  heading: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Section title"
              />
            </div>

            {/* Subheading */}
            <div>
              <label className="block text-sm font-medium mb-1">Subheading</label>
              <input
                type="text"
                value={editingSection.data.subheading || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  subheading: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Optional subheading"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editingSection.data.description || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  description: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Optional description or content"
              />
            </div>

            {/* Text content (for CTA, etc) */}
            <div>
              <label className="block text-sm font-medium mb-1">Text Content</label>
              <textarea
                value={editingSection.data.text || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  text: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Main text for the section"
              />
            </div>

            {/* Background Image URL (for Hero sections) */}
            {editingSection.type === 'hero' && (
              <div>
                <label className="block text-sm font-medium mb-1">Background Image URL</label>
                <input
                  type="text"
                  value={editingSection.data.imageUrl || ''}
                  onChange={(e) => updateSection(editingSection.id, {
                    ...editingSection.data,
                    imageUrl: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                {editingSection.data.imageUrl && (
                  <div className="mt-2 relative rounded-lg overflow-hidden h-24">
                    <img 
                      src={editingSection.data.imageUrl} 
                      alt="Background preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Image will be displayed behind the hero text with a gradient overlay</p>
              </div>
            )}

            {/* Color customization */}
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <div className="flex gap-2">
                {['white', 'gray-50', 'gray-100', 'blue-50', 'green-50', 'purple-50'].map(color => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      (editingSection.data.bgColor === color) ? 'border-blue-500' : 'border-gray-200'
                    } bg-${color}`}
                    onClick={() => updateSection(editingSection.id, {
                      ...editingSection.data,
                      bgColor: color
                    })}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setEditingSection(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setEditingSection(null);
                  onSave();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold">Sections Editor</h2>
          <span className="text-xs text-gray-500 ml-2">{sections.length} sections</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Sections List */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Current Sections</h3>
            {sections.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                No sections added yet. Click "Add Section" below to get started.
              </div>
            ) : (
              <div>
                {sections.map(renderSectionPreview)}
              </div>
            )}
          </div>

          {/* Add Section Buttons */}
          <div>
            <h3 className="font-semibold mb-4">Add Sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SECTION_TYPES.map(sectionType => (
                <button
                  key={sectionType.type}
                  onClick={() => addSection(sectionType.type)}
                  className={`${sectionType.color} p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-center`}
                >
                  <div className="text-2xl mb-2">{sectionType.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{sectionType.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {renderEditor()}
    </div>
  );
}
