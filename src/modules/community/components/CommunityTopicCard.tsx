import { MessageSquare, Eye, Heart, Clock, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DiscourseTopic } from '../hooks/useDiscourse';

interface CommunityTopicCardProps {
  topic: DiscourseTopic;
  onClick?: () => void;
  compact?: boolean;
}

export function CommunityTopicCard({ topic, onClick, compact = false }: CommunityTopicCardProps) {
  const timeAgo = formatDistanceToNow(new Date(topic.lastPostedAt), { addSuffix: true });

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="group flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {topic.author?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {topic.pinned && (
              <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {topic.title}
            </h4>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {topic.replyCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {topic.author?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {topic.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {topic.closed && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Closed
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {topic.title}
          </h3>
          
          {topic.excerpt && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {topic.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              by <span className="font-medium text-gray-700 dark:text-gray-300">{topic.author?.name || 'Anonymous'}</span>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-4 h-4" />
          <span>{topic.replyCount} replies</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Eye className="w-4 h-4" />
          <span>{topic.views} views</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Heart className="w-4 h-4" />
          <span>{topic.likeCount} likes</span>
        </div>
      </div>
    </div>
  );
}
