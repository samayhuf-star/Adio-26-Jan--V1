import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Clock, ArrowRight, BookOpen, Tag, ChevronLeft, Filter } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  wordCount: number;
  imageUrl: string | null;
  featured: boolean;
  createdAt: string;
}

interface BlogListingProps {
  onBack: () => void;
  onArticleClick: (slug: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Budget & Costs': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Quality Score': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Keywords': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Getting Started': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Comparisons': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Extensions': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Conversions & Tracking': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Troubleshooting': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Optimization': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Ad Creation': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Campaign Strategy': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
}

export default function BlogListing({ onBack, onArticleClick }: BlogListingProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blogs');
      const data = await res.json();
      setPosts(data.blogs || []);
      const cats = [...new Set((data.blogs || []).map((p: BlogPost) => p.category).filter(Boolean))] as string[];
      setCategories(cats.sort());
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.filter(p => p.featured).slice(0, 3);
  const regularPosts = filteredPosts.filter(p => selectedCategory !== 'all' || searchQuery !== '' || !p.featured);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>Google Ads Blog - Tips, Strategies & Guides | Adiology</title>
        <meta name="description" content="Expert Google Ads guides, tips and strategies. Learn about campaign optimization, keyword research, Quality Score, bidding strategies, and more." />
        <link rel="canonical" href="https://adiology.io/blog" />
        <meta property="og:title" content="Google Ads Blog | Adiology" />
        <meta property="og:description" content="Expert Google Ads guides and strategies to optimize your campaigns." />
        <meta property="og:url" content="https://adiology.io/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900">Adiology Blog</span>
              </div>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" />
                Google Ads Knowledge Hub
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                Master Google Ads
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl">
                Expert guides, actionable strategies, and proven tips to optimize your Google Ads campaigns and maximize ROI.
              </p>
              <div className="mt-8 flex items-center gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {posts.length} Articles
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {categories.length} Categories
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
              >
                All
              </button>
              {categories.map(cat => {
                const style = getCategoryStyle(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : `${style.bg} ${style.text} border ${style.border} hover:shadow-sm`}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCategory === 'all' && searchQuery === '' && featuredPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPosts.map((post, idx) => {
                  const style = getCategoryStyle(post.category);
                  return (
                    <button
                      key={post.id}
                      onClick={() => onArticleClick(post.slug)}
                      className={`group text-left bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1 ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                    >
                      <div className={`${idx === 0 ? 'p-8' : 'p-6'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                            {post.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <h3 className={`font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 ${idx === 0 ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
                          {post.title}
                        </h3>
                        <p className={`text-slate-500 leading-relaxed ${idx === 0 ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'}`}>
                          {post.excerpt}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:gap-3 transition-all">
                          Read Article
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-6 animate-pulse">
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No articles found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                {selectedCategory !== 'all' ? selectedCategory : searchQuery ? 'Search Results' : 'All Articles'}
                <span className="text-sm font-normal text-slate-400 ml-2">({regularPosts.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map(post => {
                  const style = getCategoryStyle(post.category);
                  return (
                    <button
                      key={post.id}
                      onClick={() => onArticleClick(post.slug)}
                      className="group text-left bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 text-lg leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                        <span className="flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                          Read
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <footer className="bg-slate-50 border-t border-slate-200/60 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Adiology. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
