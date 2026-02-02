import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthCompat, useUserCompat } from '../../../utils/authCompat';
import { apiCache, createCacheKey } from '../../../utils/apiCache';

export interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  postsCount: number;
  replyCount: number;
  views: number;
  likeCount: number;
  createdAt: string;
  lastPostedAt: string;
  categoryId: number;
  pinned: boolean;
  closed: boolean;
  author?: {
    id: number;
    username: string;
    name: string;
  };
}

export interface DiscourseCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string;
  topicCount: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 60 * 1000; // 1 minute

export function useDiscourseTopics(limit: number = 10, options?: { enabled?: boolean }) {
  const [topics, setTopics] = useState<DiscourseTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuthCompat();
  const hasFetched = useRef(false);
  const enabled = options?.enabled ?? true;

  const fetchTopics = useCallback(async (forceRefresh = false) => {
    const cacheKey = createCacheKey('discourse', 'topics', limit);

    const cachedTopics = apiCache.get<{ topics: DiscourseTopic[] }>(cacheKey);
    const hasCache = cachedTopics !== null;
    const isStale = apiCache.isStale(cacheKey, STALE_TIME);

    if (hasCache && !forceRefresh) {
      setTopics(cachedTopics.topics || []);
      if (!isStale) {
        setLoading(false);
        return;
      }
    }

    try {
      if (!hasCache) {
        setLoading(true);
      }
      setError(null);

      const fetcher = async () => {
        const token = await getToken();
        const response = await fetch(`/api/community/topics?limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 429) {
          console.warn('Community topics rate limited');
          return { topics: [] };
        }

        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }

        return response.json();
      };

      const data = await apiCache.dedupe<{ topics: DiscourseTopic[] }>(
        cacheKey,
        fetcher,
        { ttl: CACHE_TTL, staleWhileRevalidate: true, staleTime: STALE_TIME }
      );

      setTopics(data.topics || []);
    } catch (err) {
      if (!hasCache) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [limit, getToken]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTopics();
    }
  }, [enabled, fetchTopics]);

  const refetch = useCallback(() => {
    hasFetched.current = true;
    return fetchTopics(true);
  }, [fetchTopics]);

  return { topics, loading, error, refetch };
}

export function useDiscourseCategories(options?: { enabled?: boolean }) {
  const [categories, setCategories] = useState<DiscourseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuthCompat();
  const hasFetched = useRef(false);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (hasFetched.current) {
      return;
    }

    const cacheKey = createCacheKey('discourse', 'categories');
    const cached = apiCache.get<{ categories: DiscourseCategory[] }>(cacheKey);
    const hasCache = cached !== null;
    const isStale = apiCache.isStale(cacheKey, STALE_TIME);

    if (hasCache) {
      setCategories(cached.categories || []);
      if (!isStale) {
        setLoading(false);
        return;
      }
    }

    async function fetchCategories() {
      hasFetched.current = true;
      if (!hasCache) {
        setLoading(true);
      }

      try {
        const fetcher = async () => {
          const token = await getToken();
          const response = await fetch('/api/community/categories', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 429) {
            console.warn('Community categories rate limited');
            return { categories: [] };
          }

          if (response.ok) {
            return response.json();
          }
          return { categories: [] };
        };

        const data = await apiCache.dedupe<{ categories: DiscourseCategory[] }>(
          cacheKey,
          fetcher,
          { ttl: CACHE_TTL, staleWhileRevalidate: true, staleTime: STALE_TIME }
        );

        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [getToken, enabled]);

  return { categories, loading };
}

export function useDiscourseSSO() {
  const { getToken } = useAuthCompat();
  const { user } = useUserCompat();
  const [loading, setLoading] = useState(false);

  const loginToDiscourse = useCallback(async () => {
    if (!user) return null;

    try {
      setLoading(true);
      const token = await getToken();

      const nhostUser = user as any;
      const userEmail = nhostUser.email || '';
      const userName = nhostUser.displayName || nhostUser.metadata?.name || 'User';
      const userUsername = nhostUser.metadata?.username || userEmail.split('@')[0];
      const userAvatar = nhostUser.avatarUrl || '';

      const response = await fetch('/api/community/sso/initiate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            id: user.id,
            email: userEmail,
            name: userName,
            username: userUsername,
            avatarUrl: userAvatar,
          },
          returnPath: '/',
        }),
      });

      if (!response.ok) {
        throw new Error('SSO initiation failed');
      }

      const data = await response.json();

      const userData = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          email: userEmail,
          name: userName,
          username: userUsername,
          avatarUrl: userAvatar,
        })
      );

      const ssoCallbackUrl = `/api/community/sso?user_data=${userData}`;

      window.location.href = `${data.ssoUrl}&callback_url=${encodeURIComponent(window.location.origin + ssoCallbackUrl)}`;

      return data.ssoUrl;
    } catch (err) {
      console.error('SSO error:', err);
      window.open('https://community.adiology.io/', '_blank');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  const openForum = useCallback(() => {
    window.open('https://community.adiology.io/', '_blank');
  }, []);

  return { loginToDiscourse, openForum, loading };
}

export function useCreatePost() {
  const { getToken } = useAuthCompat();
  const { user } = useUserCompat();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(
    async (title: string, content: string, categoryId?: number) => {
      try {
        setLoading(true);
        setError(null);

        const nhostUser = user as any;
        const userEmail = nhostUser?.email || '';

        const token = await getToken();
        const response = await fetch('/api/community/posts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            categoryId,
            userId: user?.id,
            userEmail: userEmail,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create post');
        }

        apiCache.invalidatePattern('discourse:topics');

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken, user]
  );

  return { createPost, loading, error };
}
