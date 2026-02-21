import { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Plus, Loader2, Users } from 'lucide-react';
import { useDiscourseTopics } from '../hooks/useDiscourse';
import { CommunityTopicCard } from './CommunityTopicCard';
import { AskCommunityModal } from './AskCommunityModal';

interface CommunityDashboardWidgetProps {
  onViewAll?: () => void;
}

export function CommunityDashboardWidget({ onViewAll }: CommunityDashboardWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { topics, loading, error, refetch } = useDiscourseTopics(3, { enabled: isVisible });
  const [showAskModal, setShowAskModal] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  return (
    <>
      <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Community</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest discussions</p>
            </div>
          </div>
          <button
            onClick={() => setShowAskModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ask
          </button>
        </div>

        <div className="p-4">
          {!isVisible || loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load discussions</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No discussions yet</p>
              <button
                onClick={() => setShowAskModal(true)}
                className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Start the first one
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <CommunityTopicCard
                  key={topic.id}
                  topic={topic}
                  compact
                  onClick={() => window.open(`https://community.adiology.io/t/${topic.slug}/${topic.id}`, '_blank')}
                />
              ))}
            </div>
          )}
        </div>

        {topics.length > 0 && onViewAll && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onViewAll}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View all discussions
              <ArrowRight className="w-4 h-4" />
            </button>
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
