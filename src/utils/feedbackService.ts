import { supabase } from './supabase/client';
import { getCurrentAuthUser } from './auth';
import { api } from './api';

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
  screenshots: string[] | null;
  page_url: string | null;
  page_name: string | null;
  browser_info: string | null;
  screen_size: string | null;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

/**
 * Submit feedback, feature request, or bug report
 */
export async function submitFeedback(data: FeedbackData): Promise<void> {
  try {
    const user = await getCurrentAuthUser();
    const userEmail = user?.email || null;
    const userId = user?.id || null;

    // Prepare screenshot data (limit size for DB storage)
    const screenshotData = data.screenshots?.map(img => {
      // Only store first 500 chars of base64 for reference in DB
      // Full images would be sent via email or stored separately
      return img.substring(0, 500) + '...';
    }) || null;

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        user_email: userEmail,
        type: data.type,
        rating: data.rating || null,
        message: data.message,
        screenshots: screenshotData,
        page_url: data.pageUrl || null,
        page_name: data.pageName || null,
        browser_info: data.browserInfo || null,
        screen_size: data.screenSize || null,
        status: 'new',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB insert fails, try to send email
    }

    // Build type-specific subject
    let subject = '';
    switch (data.type) {
      case 'bug_report':
        subject = `Bug Report from ${userEmail || 'Anonymous User'}`;
        break;
      case 'feature_request':
        subject = `Feature Request from ${userEmail || 'Anonymous User'}`;
        break;
      default:
        subject = `Feedback from ${userEmail || 'Anonymous User'}`;
    }

    // Build type label
    const typeLabel = data.type === 'bug_report' 
      ? 'Bug Report' 
      : data.type === 'feature_request' 
      ? 'Feature Request' 
      : 'Feedback';

    // Send email notification
    try {
      await api.post('/send-feedback-email', {
        to: 'samayhuf@gmail.com',
        subject,
        body: `
          Type: ${typeLabel}
          ${data.rating ? `Rating: ${data.rating}/5` : ''}
          User: ${userEmail || 'Anonymous'}
          ${userId ? `User ID: ${userId}` : ''}
          
          Page: ${data.pageName || 'Unknown'}
          URL: ${data.pageUrl || 'Unknown'}
          Screen Size: ${data.screenSize || 'Unknown'}
          Browser: ${data.browserInfo?.substring(0, 100) || 'Unknown'}
          
          Message:
          ${data.message}
          
          Screenshots Attached: ${data.screenshots?.length || 0}
          
          ---
          Submitted at: ${new Date().toISOString()}
        `,
        feedbackType: data.type,
        rating: data.rating,
        userEmail: userEmail,
        screenshots: data.screenshots, // Send full screenshots in email
        pageInfo: {
          url: data.pageUrl,
          name: data.pageName,
          screenSize: data.screenSize,
          browser: data.browserInfo,
        },
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the whole operation if email fails
    }
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }
}

/**
 * Get all feedback (for admin)
 */
export async function getAllFeedback(): Promise<FeedbackRecord[]> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    throw error;
  }
}

/**
 * Update feedback status (for admin)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackRecord['status']
): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedback')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to update feedback status:', error);
    throw error;
  }
}
