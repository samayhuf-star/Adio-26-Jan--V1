import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat, useUserCompat } from '../../../utils/authCompat';

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

export function useDiscourseTopics(limit: number = 10) {
  const [topics, setTopics] = useState<DiscourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuthCompat();

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(`/api/community/topics?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle rate limiting gracefully - don't retry or show error
      if (response.status === 429) {
        console.warn('Community topics rate limited');
        setTopics([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit, getToken]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics };
}

export function useDiscourseCategories() {
  const [categories, setCategories] = useState<DiscourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuthCompat();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const token = await getToken();
        const response = await fetch('/api/community/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Handle rate limiting gracefully
        if (response.status === 429) {
          console.warn('Community categories rate limited');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [getToken]);

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

      const response = await fetch('/api/community/sso/initiate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.firstName || 'User',
            username: user.username,
            avatarUrl: user.imageUrl,
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
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.firstName || 'User',
          username: user.username,
          avatarUrl: user.imageUrl,
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
            userEmail: user?.primaryEmailAddress?.emailAddress,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create post');
        }

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
