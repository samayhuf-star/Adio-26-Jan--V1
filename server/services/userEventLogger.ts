import { db } from "../db";
import { userEvents } from "../../shared/schema";

export type UserEventType =
  | "signup"
  | "login"
  | "email_verification_sent"
  | "email_verified"
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "payment_succeeded"
  | "payment_failed"
  | "subscription_created"
  | "subscription_canceled"
  | "subscription_upgraded"
  | "subscription_reactivated"
  | "trial_started"
  | "checkout_completed"
  | "card_validated"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "profile_updated"
  | "blocked"
  | "unblocked"
  | "deleted"
  | "admin_edit"
  | "error";

export async function logUserEvent(
  userId: string,
  eventType: UserEventType,
  title: string,
  description?: string,
  metadata?: Record<string, any>,
  eventDate?: Date
): Promise<void> {
  try {
    await db.insert(userEvents).values({
      userId,
      eventType,
      title,
      description: description || null,
      metadata: metadata || {},
      createdAt: eventDate || new Date(),
    });
  } catch (err) {
    console.error(`[UserEventLogger] Failed to log event "${eventType}" for user ${userId}:`, err);
  }
}
