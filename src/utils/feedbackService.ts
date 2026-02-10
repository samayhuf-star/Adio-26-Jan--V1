import { getCurrentAuthUser } from './auth';

export interface FeedbackData {
  type: 'feedback' | 'feature_request' | 'bug_report';
  rating?: number;
  message: string;
  screenshots?: string[];
  pageUrl?: string;
  pageName?: string;
  browserInfo?: string;
  screenSize?: string;
}

export interface FeedbackRecord {
  id: string;
  user_id: string | null;
  user_email: string | null;
  type: 'feedback' | 'feature_request' | 'bug_report';
  rating: number | null;
  message: string;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export async function submitFeedback(data: FeedbackData): Promise<void> {
  try {
    const user = await getCurrentAuthUser();
    const userEmail = user?.email || null;
    const userId = user?.id || null;

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userEmail,
        type: data.type,
        rating: data.rating || null,
        message: data.message,
        pageUrl: data.pageUrl || null,
        pageName: data.pageName || null,
        browserInfo: data.browserInfo || null,
        screenSize: data.screenSize || null,
        screenshots: data.screenshots || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit feedback');
    }
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }
}

export async function getAllFeedback(): Promise<FeedbackRecord[]> {
  try {
    const response = await fetch('/api/feedback');
    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }
    const data = await response.json();
    return data.feedback || [];
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    throw error;
  }
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackRecord['status']
): Promise<void> {
  try {
    const response = await fetch(`/api/feedback/${feedbackId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update feedback status');
    }
  } catch (error) {
    console.error('Failed to update feedback status:', error);
    throw error;
  }
}
