import { Mail } from 'lucide-react';

interface FooterProps {
  onNavigateToPolicy?: (policy: string) => void;
  onNavigateToSection?: (section: string) => void;
  onNavigateToApp?: (tab: string) => void;
  onNavigateToPage?: (page: string) => void;
}

export function Footer({ onNavigateToPolicy, onNavigateToSection, onNavigateToApp, onNavigateToPage }: FooterProps) {
  const handlePolicyClick = (e: React.MouseEvent<HTMLAnchorElement>, policy: string) => {
    if (onNavigateToPolicy) {
      e.preventDefault();
      onNavigateToPolicy(policy);
    }
  };

  const handleAppClick = (e: React.MouseEvent<HTMLAnchorElement>, tab: string) => {
    if (onNavigateToApp) {
      e.preventDefault();
      onNavigateToApp(tab);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    if (onNavigateToPage) {
      e.preventDefault();
      onNavigateToPage(page);
    }
  };

  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-white font-semibold text-lg">adiology</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              The all-in-one platform for building, managing, and protecting Google Ads campaigns at scale.
            </p>
            <a href="mailto:support@adiology.io" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-4">
              <Mail className="w-4 h-4" />
              support@adiology.io
            </a>
            <div className="flex items-center gap-4">
              <a href="https://x.com/adiology" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter/X">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/company/adiology" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://youtube.com/@adiology" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="/?tab=campaign-builder" onClick={(e) => handleAppClick(e, 'campaign-builder')} className="text-slate-400 hover:text-white text-sm transition-colors">Campaign Builder</a></li>
              <li><a href="/?tab=keyword-planner" onClick={(e) => handleAppClick(e, 'keyword-planner')} className="text-slate-400 hover:text-white text-sm transition-colors">Keyword Planner</a></li>
              <li><a href="/?tab=keyword-mixer" onClick={(e) => handleAppClick(e, 'keyword-mixer')} className="text-slate-400 hover:text-white text-sm transition-colors">Keyword Mixer</a></li>
              <li><a href="/?tab=negative-keywords" onClick={(e) => handleAppClick(e, 'negative-keywords')} className="text-slate-400 hover:text-white text-sm transition-colors">Negative Keywords</a></li>
              <li><a href="/?tab=long-tail-generator" onClick={(e) => handleAppClick(e, 'long-tail-generator')} className="text-slate-400 hover:text-white text-sm transition-colors">Long Tail Generator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">More</h4>
            <ul className="space-y-2">
              <li><a href="/?tab=click-guard" onClick={(e) => handleAppClick(e, 'click-guard')} className="text-slate-400 hover:text-white text-sm transition-colors">Click Guard</a></li>
              <li><a href="/?tab=domain-monitoring" onClick={(e) => handleAppClick(e, 'domain-monitoring')} className="text-slate-400 hover:text-white text-sm transition-colors">Domain Monitor</a></li>
              <li><a href="/?tab=proxy-mail" onClick={(e) => handleAppClick(e, 'proxy-mail')} className="text-slate-400 hover:text-white text-sm transition-colors">Proxy Mail</a></li>
              <li><a href="/?tab=preset-campaigns" onClick={(e) => handleAppClick(e, 'preset-campaigns')} className="text-slate-400 hover:text-white text-sm transition-colors">Preset Campaigns</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" onClick={(e) => handlePolicyClick(e, 'privacy')} className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" onClick={(e) => handlePolicyClick(e, 'terms')} className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</a></li>
              <li><a href="/cookie-policy" onClick={(e) => handlePolicyClick(e, 'cookie')} className="text-slate-400 hover:text-white text-sm transition-colors">Cookie Policy</a></li>
              <li><a href="/gdpr-compliance" onClick={(e) => handlePolicyClick(e, 'gdpr')} className="text-slate-400 hover:text-white text-sm transition-colors">GDPR Compliance</a></li>
              <li><a href="/refund-policy" onClick={(e) => handlePolicyClick(e, 'refund')} className="text-slate-400 hover:text-white text-sm transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="/contact" onClick={(e) => handlePageClick(e, '/contact')} className="text-slate-400 hover:text-white text-sm transition-colors">Contact</a></li>
              <li><a href="/help-center" onClick={(e) => handlePageClick(e, '/help-center')} className="text-slate-400 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="/community" onClick={(e) => handlePageClick(e, '/community')} className="text-slate-400 hover:text-white text-sm transition-colors">Community</a></li>
              <li><a href="/blog" onClick={(e) => handlePageClick(e, '/blog')} className="text-slate-400 hover:text-white text-sm transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © 2026 Adiology. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center">
            <a
              href="/privacy-policy"
              onClick={(e) => handlePolicyClick(e, 'privacy')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms-of-service"
              onClick={(e) => handlePolicyClick(e, 'terms')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms
            </a>
            <a
              href="/cookie-policy"
              onClick={(e) => handlePolicyClick(e, 'cookie')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
