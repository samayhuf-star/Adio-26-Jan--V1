import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Clock, ArrowRight, BookOpen, ChevronLeft, Filter, Zap } from 'lucide-react';

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

interface Blog2ListingProps {
  onBack: () => void;
  onArticleClick: (slug: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Intent-Based Campaigns': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Geographic Targeting': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Match Types': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'PMax Campaigns': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Shopping Campaigns': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Smart Bidding': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'AI Max': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Responsive Search Ads': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Display Advertising': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'YouTube Ads': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Competitor Targeting': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Reporting & Analytics': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Campaign Structure': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
}

export default function Blog2Listing({ onBack, onArticleClick }: Blog2ListingProps) {
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
      const res = await fetch('/api/blogs-2');
      const data = await res.json();
      setPosts(data.blogs || []);
      const cats = [...new Set((data.blogs || []).map((p: BlogPost) => p.category).filter(Boolean))] as string[];
      setCategories(cats.sort());
    } catch (err) {
      console.error('Failed to fetch blog-2 posts:', err);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Google Ads Library — Complete Guides & Strategies | Adiology</title>
        <meta name="description" content="Comprehensive Google Ads library covering Performance Max, Smart Bidding, AI Max, match types, shopping campaigns, geo-targeting, and more. 100+ in-depth guides." />
        <link rel="canonical" href="https://adiology.io/blog-2" />
        <meta property="og:title" content="Google Ads Library — Adiology" />
        <meta property="og:description" content="100+ expert Google Ads guides covering PMax, Smart Bidding, AI Max, Shopping, and more." />
        <meta property="og:url" content="https://adiology.io/blog-2" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">Google Ads Library</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-6">
            <Zap className="w-3.5 h-3.5" />
            100+ Expert Guides
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Google Ads Library
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Deep-dive guides on Performance Max, Smart Bidding, AI Max, match types, shopping campaigns, geo-targeting, and every advanced Google Ads topic.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search guides..."
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="border-b border-slate-200/60 bg-slate-50/80 sticky top-[65px] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                }`}
              >
                All Topics
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 w-20 bg-slate-100 rounded-full mb-4" />
                <div className="h-5 w-full bg-slate-100 rounded mb-2" />
                <div className="h-5 w-4/5 bg-slate-100 rounded mb-4" />
                <div className="h-4 w-full bg-slate-50 rounded mb-2" />
                <div className="h-4 w-3/4 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No guides found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Articles are being generated — check back shortly'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'guide' : 'guides'}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => {
                const style = getCategoryStyle(post.category);
                return (
                  <button
                    key={post.id}
                    onClick={() => onArticleClick(post.slug)}
                    className="group text-left bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                        {post.category}
                      </span>
                      {post.readTime && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 text-base leading-snug line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-14 mt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Build Better Google Ads Campaigns
          </h2>
          <p className="text-blue-100 mb-7 max-w-xl mx-auto">
            Use Adiology to automate campaign creation with AI-powered keyword generation, ad writing, and direct Google Ads Editor export.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer className="bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Adiology. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
