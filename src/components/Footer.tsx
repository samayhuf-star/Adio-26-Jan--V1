interface FooterProps {
  onNavigateToPolicy?: (policy: string) => void;
  onNavigateToSection?: (section: string) => void;
}

export function Footer({ onNavigateToPolicy, onNavigateToSection }: FooterProps) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string, category: string) => {
    e.preventDefault();
    
    // Product links - scroll to sections or navigate
    if (link === 'Features') {
      const element = document.querySelector('#features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link === 'Pricing') {
      const element = document.querySelector('#pricing');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link === 'Campaign Builder' || link === 'Keyword Planner' || link === 'Ad Generator') {
      // These require login - scroll to pricing or show auth
      const element = document.querySelector('#pricing');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // Resources links
    else if (link === 'Documentation' || link === 'Help Center' || link === 'Tutorials') {
      window.open('https://docs.adiology.io', '_blank');
    } else if (link === 'Blog') {
      window.open('https://blog.adiology.io', '_blank');
    } else if (link === 'API Reference') {
      window.open('https://docs.adiology.io/api', '_blank');
    }
    // Company links
    else if (link === 'About Us') {
      const element = document.querySelector('#about') || document.querySelector('#features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link === 'Contact') {
      const element = document.querySelector('#contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = 'mailto:support@adiology.io';
      }
    } else if (link === 'Careers') {
      window.location.href = 'mailto:careers@adiology.io';
    } else if (link === 'Partners') {
      window.location.href = 'mailto:partners@adiology.io';
    }
    // Legal links
    else if (category === 'Legal') {
      const policyMap: Record<string, string> = {
        'Privacy Policy': 'privacy',
        'Terms of Service': 'terms',
        'Cookie Policy': 'cookie',
        'GDPR Compliance': 'gdpr',
        'Refund Policy': 'refund'
      };
      if (onNavigateToPolicy && policyMap[link]) {
        onNavigateToPolicy(policyMap[link]);
      }
    }
  };

  const handlePolicyClick = (e: React.MouseEvent<HTMLAnchorElement>, policy: string) => {
    e.preventDefault();
    if (onNavigateToPolicy) {
      onNavigateToPolicy(policy);
    }
  };

  const footerSections = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Campaign Builder', 'Keyword Planner', 'Ad Generator']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Help Center', 'Blog', 'API Reference', 'Tutorials']
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance', 'Refund Policy']
    },
    {
      title: 'Company',
      links: ['About Us', 'Contact', 'Careers', 'Partners']
    }
  ];

  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-white font-semibold">adiology</span>
            </div>
            <p className="text-slate-400 text-sm">
              The leading campaign management platform trusted by advertisers worldwide.
            </p>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      onClick={(e) => handleLinkClick(e, link, section.title)}
                      className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © 2025 Adiology. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center">
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'privacy')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'terms')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Terms
            </a>
            <a 
              href="#" 
              onClick={(e) => handlePolicyClick(e, 'cookie')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
