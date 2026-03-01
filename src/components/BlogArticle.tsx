import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Clock, Calendar, User, Tag, BookOpen, ArrowRight, Share2, Copy, Check } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  wordCount: number;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
}

interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  createdAt: string;
}

interface BlogArticleProps {
  slug: string;
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

export default function BlogArticle({ slug, onBack, onArticleClick }: BlogArticleProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blogs/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setArticle(data.article);
      setRelated(data.related || []);
    } catch (err) {
      console.error('Failed to fetch article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://adiology.io/blog/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded mb-8" />
          <div className="h-10 w-3/4 bg-slate-200 rounded mb-4" />
          <div className="h-10 w-1/2 bg-slate-200 rounded mb-8" />
          <div className="flex gap-4 mb-12">
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-5 w-24 bg-slate-100 rounded-full" />
            <div className="h-5 w-28 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-700 mb-2">Article Not Found</h2>
          <p className="text-slate-500 mb-6">The article you're looking for doesn't exist.</p>
          <button onClick={onBack} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const categoryStyle = getCategoryStyle(article.category);

  return (
    <>
      <Helmet>
        <title>{article.metaTitle || `${article.title} | Adiology Blog`}</title>
        <meta name="description" content={article.metaDescription || article.excerpt || ''} />
        <link rel="canonical" href={`https://adiology.io/blog/${article.slug}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || ''} />
        <meta property="og:url" content={`https://adiology.io/blog/${article.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={article.createdAt} />
        <meta property="article:section" content={article.category} />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt || ''} />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              All Articles
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </header>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                {article.category}
              </span>
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.createdAt)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {article.title}
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-3xl">
              {article.excerpt}
            </p>

            <div className="flex items-center gap-3 mt-8 pt-8 border-t border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {article.author.split(' ').map(w => w[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{article.author}</p>
                <p className="text-xs text-slate-400">{article.wordCount} words</p>
              </div>
            </div>
          </div>

          <div
            className="blog-article-content max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="bg-slate-50 border-t border-slate-200/60 py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map(r => {
                  const rStyle = getCategoryStyle(r.category);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onArticleClick(r.slug)}
                      className="group text-left bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rStyle.bg} ${rStyle.text} border ${rStyle.border} mb-3`}>
                        {r.category}
                      </span>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 text-base leading-snug">
                        {r.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">{r.excerpt}</p>
                      <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Build Better Google Ads Campaigns?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Use Adiology to automate your campaign creation with AI-powered keyword generation, ad writing, and CSV export for Google Ads Editor.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <footer className="bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Adiology. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
