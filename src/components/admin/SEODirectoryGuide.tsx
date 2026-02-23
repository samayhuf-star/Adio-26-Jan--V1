import { useState } from 'react';
import {
  Globe, ExternalLink, CheckCircle2, Search, Shield,
  Zap, BarChart3, BookOpen, Copy, Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

interface Directory {
  name: string;
  url: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  submitted?: boolean;
}

const DIRECTORIES: Directory[] = [
  { name: 'Google Search Console', url: 'https://search.google.com/search-console', category: 'Search Engines', priority: 'high', description: 'Submit sitemap, monitor indexing, fix crawl errors' },
  { name: 'Bing Webmaster Tools', url: 'https://www.bing.com/webmasters', category: 'Search Engines', priority: 'high', description: 'Submit to Bing & Yahoo, import from Google SC' },
  { name: 'Yandex Webmaster', url: 'https://webmaster.yandex.com', category: 'Search Engines', priority: 'medium', description: 'Russian search engine, covers CIS countries' },
  { name: 'Baidu Webmaster', url: 'https://ziyuan.baidu.com', category: 'Search Engines', priority: 'medium', description: 'Chinese search engine, largest in China' },
  { name: 'IndexNow', url: 'https://www.indexnow.org', category: 'Search Engines', priority: 'high', description: 'Instant indexing for Bing, Yandex, and others' },
  { name: 'Google Business Profile', url: 'https://business.google.com', category: 'Business Listings', priority: 'high', description: 'Local business listing, appears in Google Maps' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com', category: 'Product Directories', priority: 'high', description: 'Launch your product, get early adopters and reviews' },
  { name: 'G2', url: 'https://www.g2.com/products/new', category: 'Software Reviews', priority: 'high', description: 'B2B software review platform, high domain authority' },
  { name: 'Capterra', url: 'https://www.capterra.com/vendors/sign-up', category: 'Software Reviews', priority: 'high', description: 'Software comparison site owned by Gartner' },
  { name: 'GetApp', url: 'https://www.getapp.com', category: 'Software Reviews', priority: 'medium', description: 'Part of Gartner Digital Markets network' },
  { name: 'Software Advice', url: 'https://www.softwareadvice.com', category: 'Software Reviews', priority: 'medium', description: 'Gartner-owned software recommendation service' },
  { name: 'AlternativeTo', url: 'https://alternativeto.net', category: 'Product Directories', priority: 'high', description: 'Find and list software alternatives' },
  { name: 'SaaSHub', url: 'https://www.saashub.com/submit', category: 'Product Directories', priority: 'medium', description: 'SaaS product directory and comparison' },
  { name: 'BetaList', url: 'https://betalist.com/submit', category: 'Product Directories', priority: 'medium', description: 'Discover and get early access to startups' },
  { name: 'Crunchbase', url: 'https://www.crunchbase.com', category: 'Business Listings', priority: 'high', description: 'Business information platform, good for SEO authority' },
  { name: 'AngelList / Wellfound', url: 'https://wellfound.com', category: 'Business Listings', priority: 'medium', description: 'Startup platform for hiring and investing' },
  { name: 'LinkedIn Company Page', url: 'https://www.linkedin.com/company/setup/new/', category: 'Social & Professional', priority: 'high', description: 'Professional network, B2B visibility' },
  { name: 'Twitter/X', url: 'https://twitter.com', category: 'Social & Professional', priority: 'high', description: 'Social media presence, engage with PPC community' },
  { name: 'Facebook Business', url: 'https://business.facebook.com', category: 'Social & Professional', priority: 'medium', description: 'Business page for social proof' },
  { name: 'Reddit (r/PPC, r/googleads)', url: 'https://www.reddit.com/r/PPC/', category: 'Community', priority: 'high', description: 'Engage in PPC communities, share expertise' },
  { name: 'Indie Hackers', url: 'https://www.indiehackers.com', category: 'Community', priority: 'medium', description: 'Community for bootstrapped founders' },
  { name: 'Hacker News (Show HN)', url: 'https://news.ycombinator.com/showhn.html', category: 'Community', priority: 'high', description: 'Tech community, high-quality traffic' },
  { name: 'DMOZ / Curlie', url: 'https://curlie.org/docs/en/add.html', category: 'Web Directories', priority: 'low', description: 'Open Directory Project successor' },
  { name: 'Hotfrog', url: 'https://www.hotfrog.com', category: 'Business Listings', priority: 'low', description: 'Business directory, international coverage' },
  { name: 'Jasmine Directory', url: 'https://www.jasminedirectory.com', category: 'Web Directories', priority: 'low', description: 'Curated web directory' },
  { name: 'SourceForge', url: 'https://sourceforge.net', category: 'Software Reviews', priority: 'medium', description: 'Software comparison and reviews platform' },
  { name: 'TrustRadius', url: 'https://www.trustradius.com', category: 'Software Reviews', priority: 'medium', description: 'B2B technology review platform' },
  { name: 'Clutch.co', url: 'https://clutch.co', category: 'Business Listings', priority: 'medium', description: 'B2B ratings and reviews platform' },
  { name: 'AppSumo Marketplace', url: 'https://sell.appsumo.com', category: 'Product Directories', priority: 'high', description: 'Software deals marketplace, great for lifetime deals' },
  { name: 'Startup Stash', url: 'https://startupstash.com/submit/', category: 'Product Directories', priority: 'low', description: 'Curated directory of startup resources' },
  { name: 'SaaSWorthy', url: 'https://www.saasworthy.com', category: 'Software Reviews', priority: 'low', description: 'SaaS product reviews and comparisons' },
  { name: 'ToolPilot.ai', url: 'https://www.toolpilot.ai', category: 'AI Directories', priority: 'medium', description: 'AI tools directory' },
  { name: 'There\'s An AI For That', url: 'https://theresanaiforthat.com/submit/', category: 'AI Directories', priority: 'high', description: 'Largest AI tools directory, high traffic' },
  { name: 'Futurepedia', url: 'https://www.futurepedia.io/submit-tool', category: 'AI Directories', priority: 'medium', description: 'AI tools directory with categorization' },
  { name: 'AI Tool Directory', url: 'https://aitoolsdirectory.com/submit', category: 'AI Directories', priority: 'low', description: 'Growing AI tools listing site' },
  { name: 'TopAI.tools', url: 'https://topai.tools/submit', category: 'AI Directories', priority: 'medium', description: 'AI tools discovery platform' },
];

const CATEGORIES = ['All', 'Search Engines', 'Business Listings', 'Product Directories', 'Software Reviews', 'AI Directories', 'Social & Professional', 'Community', 'Web Directories'];

const SEO_CHECKLIST = [
  { item: 'Sitemap submitted to Google Search Console', category: 'Technical SEO' },
  { item: 'Sitemap submitted to Bing Webmaster Tools', category: 'Technical SEO' },
  { item: 'All pages have unique title tags (done)', category: 'On-Page SEO' },
  { item: 'All pages have unique meta descriptions (done)', category: 'On-Page SEO' },
  { item: 'All pages have canonical URLs (done)', category: 'On-Page SEO' },
  { item: 'Open Graph tags on all public pages (done)', category: 'On-Page SEO' },
  { item: 'Twitter Card tags on all public pages (done)', category: 'On-Page SEO' },
  { item: 'JSON-LD structured data on all pages (done)', category: 'On-Page SEO' },
  { item: 'robots.txt properly configured (done)', category: 'Technical SEO' },
  { item: 'Blog articles with SEO-optimized content (done)', category: 'Content SEO' },
  { item: 'Internal linking between feature pages and blog', category: 'On-Page SEO' },
  { item: 'Image alt text on all images', category: 'On-Page SEO' },
  { item: 'Mobile-responsive design (done)', category: 'Technical SEO' },
  { item: 'Page speed optimization', category: 'Technical SEO' },
  { item: 'HTTPS enabled (done)', category: 'Technical SEO' },
  { item: 'Submit to 10+ directories from the list below', category: 'Off-Page SEO' },
  { item: 'Create social media profiles and link back', category: 'Off-Page SEO' },
  { item: 'Get listed on AI tool directories', category: 'Off-Page SEO' },
  { item: 'Get reviews on G2, Capterra, TrustRadius', category: 'Off-Page SEO' },
  { item: 'Guest post on PPC/marketing blogs', category: 'Off-Page SEO' },
];

export default function SEODirectoryGuide() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitted, setSubmitted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('seo_submitted_dirs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('seo_checklist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggleSubmitted = (name: string) => {
    const next = new Set(submitted);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSubmitted(next);
    localStorage.setItem('seo_submitted_dirs', JSON.stringify([...next]));
  };

  const toggleChecked = (item: string) => {
    const next = new Set(checkedItems);
    if (next.has(item)) next.delete(item); else next.add(item);
    setCheckedItems(next);
    localStorage.setItem('seo_checklist', JSON.stringify([...next]));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filtered = DIRECTORIES.filter(d => {
    const matchesCat = filter === 'All' || d.category === filter;
    const matchesSearch = !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const priorityColor = (p: string) => {
    if (p === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (p === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const submittedCount = submitted.size;
  const totalCount = DIRECTORIES.length;
  const checkedCount = checkedItems.size;
  const totalChecklist = SEO_CHECKLIST.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          SEO & Directory Submission Guide
        </h3>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-3 py-1">
            {submittedCount}/{totalCount} Submitted
          </Badge>
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-sm px-3 py-1">
            {checkedCount}/{totalChecklist} SEO Tasks Done
          </Badge>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" /> SEO Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SEO_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={checkedItems.has(item.item)}
                onChange={() => toggleChecked(item.item)}
                className="mt-0.5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
              />
              <div>
                <span className={`text-sm ${checkedItems.has(item.item) ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {item.item}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-2">{item.category}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Quick Links
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="https://adiology.io/sitemap.xml" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-sm text-white">Sitemap.xml</div>
              <div className="text-xs text-slate-400">43 URLs indexed</div>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
          </a>
          <a href="https://adiology.io/robots.txt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
            <BookOpen className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-sm text-white">Robots.txt</div>
              <div className="text-xs text-slate-400">Crawl rules configured</div>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
          </a>
          <a href="https://search.google.com/test/rich-results?url=https%3A%2F%2Fadiology.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
            <Search className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-sm text-white">Rich Results Test</div>
              <div className="text-xs text-slate-400">Test structured data</div>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
          </a>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" /> Directory Submissions ({totalCount} directories)
        </h4>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search directories..."
              className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${filter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((dir, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${submitted.has(dir.name) ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-700/20 border-slate-700/30 hover:bg-slate-700/40'}`}>
              <button
                onClick={() => toggleSubmitted(dir.name)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${submitted.has(dir.name) ? 'bg-green-500 border-green-500' : 'border-slate-500 hover:border-indigo-400'}`}
              >
                {submitted.has(dir.name) && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${submitted.has(dir.name) ? 'text-green-400' : 'text-white'}`}>{dir.name}</span>
                  <Badge className={`text-[10px] ${priorityColor(dir.priority)}`}>{dir.priority}</Badge>
                  <Badge className="text-[10px] bg-slate-600/30 text-slate-400 border-slate-600/50">{dir.category}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{dir.description}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => copyUrl(dir.url)}
                  className="p-1.5 rounded-md hover:bg-slate-600/50 transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl === dir.url ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <a
                  href={dir.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-slate-600/50 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
