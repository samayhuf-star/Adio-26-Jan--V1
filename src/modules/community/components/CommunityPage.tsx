import { useState } from 'react';
import { MessageSquare, Plus, Search, Filter, RefreshCw, Loader2, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { useDiscourseTopics, useDiscourseCategories, useDiscourseSSO } from '../hooks/useDiscourse';
import { CommunityTopicCard } from './CommunityTopicCard';
import { AskCommunityModal } from './AskCommunityModal';

export function CommunityPage() {
  const [showAskModal, setShowAskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const { topics, loading, error, refetch } = useDiscourseTopics(20);
  const { categories } = useDiscourseCategories();
  const { openForum, loading: ssoLoading } = useDiscourseSSO();

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch = !searchQuery || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || topic.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenInForum = () => {
    openForum();
  };

  const stats = [
    { label: 'Topics', value: topics.length, icon: MessageSquare },
    { label: 'Total Views', value: topics.reduce((sum, t) => sum + t.views, 0), icon: TrendingUp },
    { label: 'Active Members', value: '2.1k', icon: Users },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Community
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Connect with other Adiology users, share tips, and get help
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenInForum}
              disabled={ssoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {ssoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Open Forum
            </button>
            <button
              onClick={() => setShowAskModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-5 h-5" />
              Ask Community
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => refetch()}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-60">({cat.topicCount})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unable to load discussions
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || selectedCategory ? 'No matching discussions' : 'No discussions yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters'
                : 'Be the first to start a conversation!'}
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Start a Discussion
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopics.map((topic) => (
              <CommunityTopicCard
                key={topic.id}
                topic={topic}
                onClick={() => window.open(`${import.meta.env.VITE_DISCOURSE_URL || 'https://community.adiology.io'}/t/${topic.slug}/${topic.id}`, '_blank')}
              />
            ))}
          </div>
        )}
      </div>

      <AskCommunityModal
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
        onSuccess={refetch}
      />
    </>
  );
}

export default CommunityPage;
