interface FooterProps {
  onNavigateToPolicy?: (policy: string) => void;
}

export function Footer({ onNavigateToPolicy }: FooterProps) {
  const footerLinks = {
    Product: ['Features', 'Templates', 'Pricing', 'Integrations', 'API'],
    Solutions: ['E-commerce', 'SaaS', 'Agencies', 'Enterprise', 'Small Business'],
    Resources: ['Documentation', 'Help Center', 'Blog', 'Community', 'Webinars'],
    Company: ['About', 'Careers', 'Contact', 'Partners', 'Press']
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link === 'Contact') {
      e.preventDefault();
      const element = document.querySelector('#contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link === 'Features') {
      e.preventDefault();
      const element = document.querySelector('#features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link === 'Pricing') {
      e.preventDefault();
      const element = document.querySelector('#pricing');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePolicyClick = (e: React.MouseEvent<HTMLAnchorElement>, policy: string) => {
    e.preventDefault();
    if (onNavigateToPolicy) {
      onNavigateToPolicy(policy);
    }
  };

  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Logo Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white">A</span>
              </div>
              <span className="text-gray-900">adiology</span>
            </div>
            <p className="text-gray-600 text-sm">
              The leading campaign management platform trusted by advertisers worldwide.
            </p>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-gray-900 mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      onClick={(e) => handleLinkClick(e, link)}
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            © 2025 Adiology. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center">
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'privacy')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'terms')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'cookie')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cookie Policy
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'gdpr')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              GDPR Compliance
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'refund')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
