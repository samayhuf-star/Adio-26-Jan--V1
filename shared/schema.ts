import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, decimal, varchar, unique, index, inet } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user"),
  subscriptionPlan: text("subscription_plan").default("free"),
  subscriptionStatus: text("subscription_status").default("active"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  aiUsage: integer("ai_usage").default(0),
  isBlocked: boolean("is_blocked").default(false),
  lastSignIn: timestamp("last_sign_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
  roleIdx: index("idx_users_role").on(table.role),
  subscriptionPlanIdx: index("idx_users_subscription_plan").on(table.subscriptionPlan),
  subscriptionStatusIdx: index("idx_users_subscription_status").on(table.subscriptionStatus),
  stripeCustomerIdIdx: index("idx_users_stripe_customer_id").on(table.stripeCustomerId),
  createdAtIdx: index("idx_users_created_at").on(table.createdAt),
  isBlockedIdx: index("idx_users_is_blocked").on(table.isBlocked),
}));

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  ownerId: text("owner_id"),
  isAdminWorkspace: boolean("is_admin_workspace").default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  userId: text("user_id"),
  role: text("role").default("member"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workspaceUserUnique: unique("workspace_user_unique").on(table.workspaceId, table.userId),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  planName: text("plan_name").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_subscriptions_user_id").on(table.userId),
  statusIdx: index("idx_subscriptions_status").on(table.status),
  stripeIdIdx: index("idx_subscriptions_stripe_id").on(table.stripeSubscriptionId),
  planIdx: index("idx_subscriptions_plan").on(table.planName),
  stripeCustomerIdIdx: index("idx_subscriptions_stripe_customer_id").on(table.stripeCustomerId),
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeInvoiceId: text("stripe_invoice_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  paymentMethodType: text("payment_method_type"),
  description: text("description"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  userIdIdx: index("idx_payments_user_id").on(table.userId),
  subscriptionIdIdx: index("idx_payments_subscription_id").on(table.subscriptionId),
  statusIdx: index("idx_payments_status").on(table.status),
  stripePaymentIntentIdx: index("idx_payments_stripe_payment_intent").on(table.stripePaymentIntentId),
  createdAtIdx: index("idx_payments_created_at").on(table.createdAt),
}));

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_invoices_user_id").on(table.userId),
  stripeInvoiceIdIdx: index("idx_invoices_stripe_invoice_id").on(table.stripeInvoiceId),
}));

export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  recipientEmail: text("recipient_email").notNull(),
  senderEmail: text("sender_email").default("noreply@adiology.com"),
  subject: text("subject").notNull(),
  templateName: text("template_name"),
  templateData: jsonb("template_data"),
  status: text("status").notNull().default("queued"),
  provider: text("provider").default("aws_ses"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  complainedAt: timestamp("complained_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_emails_user_id").on(table.userId),
  recipientIdx: index("idx_emails_recipient").on(table.recipientEmail),
  statusIdx: index("idx_emails_status").on(table.status),
  templateIdx: index("idx_emails_template").on(table.templateName),
  createdAtIdx: index("idx_emails_created_at").on(table.createdAt),
  sentAtIdx: index("idx_emails_sent_at").on(table.sentAt),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  adminUserId: text("admin_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  level: text("level").notNull().default("info"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_audit_logs_user_id").on(table.userId),
  adminUserIdIdx: index("idx_audit_logs_admin_user_id").on(table.adminUserId),
  actionIdx: index("idx_audit_logs_action").on(table.action),
  resourceIdx: index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
  levelIdx: index("idx_audit_logs_level").on(table.level),
  createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
}));

export const securityRules = pgTable("security_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  value: text("value").notNull(),
  reason: text("reason").notNull(),
  active: boolean("active").default(true),
  priority: integer("priority").default(100),
  expiresAt: timestamp("expires_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("idx_security_rules_type").on(table.type),
  activeIdx: index("idx_security_rules_active").on(table.active),
  priorityIdx: index("idx_security_rules_priority").on(table.priority),
  expiresAtIdx: index("idx_security_rules_expires_at").on(table.expiresAt),
  createdByIdx: index("idx_security_rules_created_by").on(table.createdBy),
}));

export const campaignHistory = pgTable("campaign_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_campaign_history_user_id").on(table.userId),
  typeIdx: index("idx_campaign_history_type").on(table.type),
  statusIdx: index("idx_campaign_history_status").on(table.status),
  createdAtIdx: index("idx_campaign_history_created_at").on(table.createdAt),
  workspaceIdIdx: index("idx_campaign_history_workspace_id").on(table.workspaceId),
}));

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  htmlTemplate: text("html_template").notNull(),
  assets: jsonb("assets").default([]),
  placeholders: jsonb("placeholders").default([]),
  category: text("category"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("idx_templates_slug").on(table.slug),
  categoryIdx: index("idx_templates_category").on(table.category),
}));

export const savedSites = pgTable("saved_sites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  templateId: uuid("template_id").references(() => templates.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  html: text("html").notNull(),
  assets: jsonb("assets").default([]),
  metadata: jsonb("metadata").default({}),
  status: text("status").notNull().default("draft"),
  vercel: jsonb("vercel").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_saved_sites_user_id").on(table.userId),
  statusIdx: index("idx_saved_sites_status").on(table.status),
  templateIdIdx: index("idx_saved_sites_template_id").on(table.templateId),
  createdAtIdx: index("idx_saved_sites_created_at").on(table.createdAt),
  workspaceIdIdx: index("idx_saved_sites_workspace_id").on(table.workspaceId),
  userSlugUnique: unique("saved_sites_user_id_slug").on(table.userId, table.slug),
}));

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  savedSiteId: uuid("saved_site_id").references(() => savedSites.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  action: text("action").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_activity_log_user_id").on(table.userId),
  savedSiteIdIdx: index("idx_activity_log_saved_site_id").on(table.savedSiteId),
  actionIdx: index("idx_activity_log_action").on(table.action),
  createdAtIdx: index("idx_activity_log_created_at").on(table.createdAt),
  workspaceIdIdx: index("idx_activity_log_workspace_id").on(table.workspaceId),
}));

export const publishedWebsites = pgTable("published_websites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  templateId: text("template_id").notNull(),
  templateData: jsonb("template_data").notNull(),
  vercelDeploymentId: text("vercel_deployment_id").notNull(),
  vercelUrl: text("vercel_url").notNull(),
  vercelProjectId: text("vercel_project_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_published_websites_user_id").on(table.userId),
  createdAtIdx: index("idx_published_websites_created_at").on(table.createdAt),
}));

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  userEmail: text("user_email"),
  type: text("type").notNull(),
  rating: integer("rating"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_feedback_user_id").on(table.userId),
  typeIdx: index("idx_feedback_type").on(table.type),
  statusIdx: index("idx_feedback_status").on(table.status),
  createdAtIdx: index("idx_feedback_created_at").on(table.createdAt),
}));

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  fields: jsonb("fields").default([]),
  settings: jsonb("settings").default({}),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_forms_user_id").on(table.userId),
  workspaceIdIdx: index("idx_forms_workspace_id").on(table.workspaceId),
}));

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: uuid("form_id").references(() => forms.id).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  data: jsonb("data").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
}, (table) => ({
  formIdIdx: index("idx_form_submissions_form_id").on(table.formId),
  workspaceIdIdx: index("idx_form_submissions_workspace_id").on(table.workspaceId),
}));

export const promoTrials = pgTable("promo_trials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
}, (table) => ({
  emailIdx: index("idx_promo_trials_email").on(table.email),
  statusIdx: index("idx_promo_trials_status").on(table.status),
}));

export const kvStore = pgTable("kv_store_6757d0ca", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const userNotifications = pgTable("user_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  read: boolean("read").default(false),
  actionType: text("action_type"),
  actionData: jsonb("action_data"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_user_notifications_user_id").on(table.userId),
  readIdx: index("idx_user_notifications_read").on(table.read),
  createdAtIdx: index("idx_user_notifications_created_at").on(table.createdAt),
}));

export const adSearchRequests = pgTable("ad_search_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  searchQuery: text("search_query").notNull(),
  advertiserDomain: text("advertiser_domain"),
  status: text("status").notNull().default("pending"),
  results: jsonb("results"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("idx_ad_search_requests_user_id").on(table.userId),
  statusIdx: index("idx_ad_search_requests_status").on(table.status),
  createdAtIdx: index("idx_ad_search_requests_created_at").on(table.createdAt),
}));

export const documentationImages = pgTable("documentation_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  articleKey: text("article_key").notNull(),
  imageData: text("image_data").notNull(),
  imageOrder: integer("image_order").notNull().default(0),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  articleKeyIdx: index("idx_doc_images_article_key").on(table.articleKey),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignHistorySchema = createInsertSchema(campaignHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const taskProjects = pgTable("task_projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_task_projects_user_id").on(table.userId),
}));

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: integer("project_id").references(() => taskProjects.id),
  title: text("title").notNull(),
  description: text("description").default(""),
  isToday: boolean("is_today").default(false),
  isCompleted: boolean("is_completed").default(false),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  order: integer("order").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_tasks_user_id").on(table.userId),
  projectIdIdx: index("idx_tasks_project_id").on(table.projectId),
  isCompletedIdx: index("idx_tasks_is_completed").on(table.isCompleted),
  isTodayIdx: index("idx_tasks_is_today").on(table.isToday),
}));

export const insertTaskProjectSchema = createInsertSchema(taskProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const emailSequenceProgress = pgTable("email_sequence_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  sequenceId: text("sequence_id").notNull(),
  emailId: text("email_id").notNull(),
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_email_seq_progress_user_id").on(table.userId),
  sequenceIdx: index("idx_email_seq_progress_sequence").on(table.sequenceId),
  emailIdx: index("idx_email_seq_progress_email").on(table.emailId),
  statusIdx: index("idx_email_seq_progress_status").on(table.status),
  scheduledAtIdx: index("idx_email_seq_progress_scheduled").on(table.scheduledAt),
}));

export const workspaceProjects = pgTable("workspace_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("folder"),
  isArchived: boolean("is_archived").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_workspace_projects_user_id").on(table.userId),
  workspaceIdIdx: index("idx_workspace_projects_workspace_id").on(table.workspaceId),
  isArchivedIdx: index("idx_workspace_projects_is_archived").on(table.isArchived),
}));

export const projectItems = pgTable("project_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => workspaceProjects.id, { onDelete: 'cascade' }).notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  itemName: text("item_name"),
  itemMetadata: jsonb("item_metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  projectIdIdx: index("idx_project_items_project_id").on(table.projectId),
  itemTypeIdx: index("idx_project_items_item_type").on(table.itemType),
  itemIdIdx: index("idx_project_items_item_id").on(table.itemId),
  uniqueProjectItem: unique("unique_project_item").on(table.projectId, table.itemType, table.itemId),
}));

export const insertWorkspaceProjectSchema = createInsertSchema(workspaceProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectItemSchema = createInsertSchema(projectItems).omit({
  id: true,
  createdAt: true,
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  templateId: text("template_id"),
  sequenceId: text("sequence_id"),
  status: text("status").notNull().default("sent"),
  messageId: text("message_id"),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  sentAt: timestamp("sent_at").defaultNow(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  error: text("error"),
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  recipientIdx: index("idx_email_logs_recipient").on(table.recipient),
  templateIdx: index("idx_email_logs_template").on(table.templateId),
  sequenceIdx: index("idx_email_logs_sequence").on(table.sequenceId),
  statusIdx: index("idx_email_logs_status").on(table.status),
  sentAtIdx: index("idx_email_logs_sent_at").on(table.sentAt),
}));

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  ownerId: text("owner_id").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("idx_organizations_owner").on(table.ownerId),
  slugIdx: index("idx_organizations_slug").on(table.slug),
}));

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("viewer"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedAt: timestamp("invited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgUserUnique: unique("org_user_unique").on(table.organizationId, table.userId),
  orgIdx: index("idx_org_members_org").on(table.organizationId),
  userIdx: index("idx_org_members_user").on(table.userId),
  roleIdx: index("idx_org_members_role").on(table.role),
}));

export const organizationInvites = pgTable("organization_invites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  code: text("code").unique().notNull(),
  email: text("email"),
  role: text("role").notNull().default("viewer"),
  invitedBy: text("invited_by").notNull(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: text("used_by"),
  maxUses: integer("max_uses").default(1),
  useCount: integer("use_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  codeIdx: index("idx_org_invites_code").on(table.code),
  orgIdx: index("idx_org_invites_org").on(table.organizationId),
  statusIdx: index("idx_org_invites_status").on(table.status),
  expiresIdx: index("idx_org_invites_expires").on(table.expiresAt),
}));

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationInviteSchema = createInsertSchema(organizationInvites).omit({
  id: true,
  createdAt: true,
});

// Chat/Conversation tables for replit integrations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  conversationIdx: index("idx_messages_conversation_id").on(table.conversationId),
}));

// Domain Monitoring tables
export const monitoredDomains = pgTable("monitored_domains", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  domain: text("domain").notNull(),
  registrar: text("registrar"),
  expiryDate: timestamp("expiry_date"),
  createdDate: timestamp("created_date"),
  updatedDate: timestamp("updated_date"),
  nameServers: jsonb("name_servers").default([]),
  whoisData: jsonb("whois_data").default({}),
  sslIssuer: text("ssl_issuer"),
  sslExpiryDate: timestamp("ssl_expiry_date"),
  sslValidFrom: timestamp("ssl_valid_from"),
  sslData: jsonb("ssl_data").default({}),
  dnsRecords: jsonb("dns_records").default({}),
  lastCheckedAt: timestamp("last_checked_at"),
  alertDays: jsonb("alert_days").default([30, 15, 7, 1]),
  alertsEnabled: boolean("alerts_enabled").default(true),
  alertEmail: text("alert_email"),
  notes: text("notes"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_monitored_domains_user_id").on(table.userId),
  domainIdx: index("idx_monitored_domains_domain").on(table.domain),
  expiryDateIdx: index("idx_monitored_domains_expiry_date").on(table.expiryDate),
  sslExpiryIdx: index("idx_monitored_domains_ssl_expiry").on(table.sslExpiryDate),
  userDomainUnique: unique("user_domain_unique").on(table.userId, table.domain),
}));

export const domainSnapshots = pgTable("domain_snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: uuid("domain_id").references(() => monitoredDomains.id, { onDelete: 'cascade' }).notNull(),
  snapshotType: text("snapshot_type").notNull(),
  data: jsonb("data").default({}),
  changes: jsonb("changes").default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  domainIdIdx: index("idx_domain_snapshots_domain_id").on(table.domainId),
  typeIdx: index("idx_domain_snapshots_type").on(table.snapshotType),
  createdAtIdx: index("idx_domain_snapshots_created_at").on(table.createdAt),
}));

export const domainAlerts = pgTable("domain_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: uuid("domain_id").references(() => monitoredDomains.id, { onDelete: 'cascade' }).notNull(),
  alertType: text("alert_type").notNull(),
  message: text("message").notNull(),
  daysUntilExpiry: integer("days_until_expiry"),
  sentAt: timestamp("sent_at"),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  domainIdIdx: index("idx_domain_alerts_domain_id").on(table.domainId),
  alertTypeIdx: index("idx_domain_alerts_type").on(table.alertType),
  sentAtIdx: index("idx_domain_alerts_sent_at").on(table.sentAt),
}));

export const insertMonitoredDomainSchema = createInsertSchema(monitoredDomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDomainSnapshotSchema = createInsertSchema(domainSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertDomainAlertSchema = createInsertSchema(domainAlerts).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type CampaignHistory = typeof campaignHistory.$inferSelect;
export type InsertCampaignHistory = z.infer<typeof insertCampaignHistorySchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type WorkspaceProject = typeof workspaceProjects.$inferSelect;
export type InsertWorkspaceProject = z.infer<typeof insertWorkspaceProjectSchema>;
export type ProjectItem = typeof projectItems.$inferSelect;
export type InsertProjectItem = z.infer<typeof insertProjectItemSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type InsertOrganizationInvite = z.infer<typeof insertOrganizationInviteSchema>;
export type MonitoredDomain = typeof monitoredDomains.$inferSelect;
export type InsertMonitoredDomain = z.infer<typeof insertMonitoredDomainSchema>;
export type DomainSnapshot = typeof domainSnapshots.$inferSelect;
export type InsertDomainSnapshot = z.infer<typeof insertDomainSnapshotSchema>;
export type DomainAlert = typeof domainAlerts.$inferSelect;
export type InsertDomainAlert = z.infer<typeof insertDomainAlertSchema>;
