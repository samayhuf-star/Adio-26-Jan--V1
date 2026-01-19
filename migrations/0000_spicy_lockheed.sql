CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"saved_site_id" uuid,
	"workspace_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ad_search_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"search_query" text NOT NULL,
	"advertiser_domain" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"results" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"admin_user_id" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"level" text DEFAULT 'info' NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"workspace_id" uuid,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_key" text NOT NULL,
	"image_data" text NOT NULL,
	"image_order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"template_id" text,
	"sequence_id" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"message_id" text,
	"opens" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"sent_at" timestamp DEFAULT now(),
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "email_sequence_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sequence_id" text NOT NULL,
	"email_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"recipient_email" text NOT NULL,
	"sender_email" text DEFAULT 'noreply@adiology.com',
	"subject" text NOT NULL,
	"template_name" text,
	"template_data" jsonb,
	"status" text DEFAULT 'queued' NOT NULL,
	"provider" text DEFAULT 'aws_ses',
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"complained_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"user_email" text,
	"type" text NOT NULL,
	"rating" integer,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"workspace_id" uuid,
	"data" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid,
	"name" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_invoice_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd',
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "kv_store_6757d0ca" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"invited_by" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" text,
	"max_uses" integer DEFAULT 1,
	"use_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"invited_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"owner_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"subscription_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"payment_method_type" text,
	"description" text,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now(),
	"paid_at" timestamp,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "project_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text,
	"item_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_project_item" UNIQUE("project_id","item_type","item_id")
);
--> statement-breakpoint
CREATE TABLE "promo_trials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"converted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "published_websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"template_id" text NOT NULL,
	"template_data" jsonb NOT NULL,
	"vercel_deployment_id" text NOT NULL,
	"vercel_url" text NOT NULL,
	"vercel_project_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"template_id" uuid,
	"workspace_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"html" text NOT NULL,
	"assets" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"vercel" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "saved_sites_user_id_slug" UNIQUE("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "security_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"reason" text NOT NULL,
	"active" boolean DEFAULT true,
	"priority" integer DEFAULT 100,
	"expires_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"plan_name" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1',
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"is_today" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"priority" text DEFAULT 'medium',
	"due_date" timestamp,
	"order" integer DEFAULT 0,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"html_template" text NOT NULL,
	"assets" jsonb DEFAULT '[]'::jsonb,
	"placeholders" jsonb DEFAULT '[]'::jsonb,
	"category" text,
	"thumbnail" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"action_type" text,
	"action_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" text DEFAULT 'user',
	"subscription_plan" text DEFAULT 'free',
	"subscription_status" text DEFAULT 'active',
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"ai_usage" integer DEFAULT 0,
	"is_blocked" boolean DEFAULT false,
	"last_sign_in" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"user_id" text,
	"role" text DEFAULT 'member',
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workspace_user_unique" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"icon" text DEFAULT 'folder',
	"is_archived" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text,
	"is_admin_workspace" boolean DEFAULT false,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_saved_site_id_saved_sites_id_fk" FOREIGN KEY ("saved_site_id") REFERENCES "public"."saved_sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_history" ADD CONSTRAINT "campaign_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_project_id_workspace_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workspace_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_sites" ADD CONSTRAINT "saved_sites_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_sites" ADD CONSTRAINT "saved_sites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_projects" ADD CONSTRAINT "workspace_projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_log_user_id" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_saved_site_id" ON "activity_log" USING btree ("saved_site_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_action" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_activity_log_created_at" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_log_workspace_id" ON "activity_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_ad_search_requests_user_id" ON "ad_search_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ad_search_requests_status" ON "ad_search_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ad_search_requests_created_at" ON "ad_search_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_user_id" ON "audit_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_level" ON "audit_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_user_id" ON "campaign_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_type" ON "campaign_history" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_status" ON "campaign_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_created_at" ON "campaign_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_workspace_id" ON "campaign_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_doc_images_article_key" ON "documentation_images" USING btree ("article_key");--> statement-breakpoint
CREATE INDEX "idx_email_logs_recipient" ON "email_logs" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "idx_email_logs_template" ON "email_logs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_sequence" ON "email_logs" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_status" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_logs_sent_at" ON "email_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_seq_progress_user_id" ON "email_sequence_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_seq_progress_sequence" ON "email_sequence_progress" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "idx_email_seq_progress_email" ON "email_sequence_progress" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "idx_email_seq_progress_status" ON "email_sequence_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_seq_progress_scheduled" ON "email_sequence_progress" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_emails_user_id" ON "emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_emails_recipient" ON "emails" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_emails_status" ON "emails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_emails_template" ON "emails" USING btree ("template_name");--> statement-breakpoint
CREATE INDEX "idx_emails_created_at" ON "emails" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_emails_sent_at" ON "emails" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_user_id" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_type" ON "feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_form_id" ON "form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_workspace_id" ON "form_submissions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_forms_user_id" ON "forms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forms_workspace_id" ON "forms" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_user_id" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_stripe_invoice_id" ON "invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_org_invites_code" ON "organization_invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_org_invites_org" ON "organization_invites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_invites_status" ON "organization_invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_org_invites_expires" ON "organization_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_org_members_org" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_role" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_organizations_owner" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_payments_user_id" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payments_subscription_id" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_stripe_payment_intent" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_payments_created_at" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_project_items_project_id" ON "project_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_items_item_type" ON "project_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "idx_project_items_item_id" ON "project_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_promo_trials_email" ON "promo_trials" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_promo_trials_status" ON "promo_trials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_published_websites_user_id" ON "published_websites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_published_websites_created_at" ON "published_websites" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_saved_sites_user_id" ON "saved_sites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_sites_status" ON "saved_sites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_saved_sites_template_id" ON "saved_sites" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_saved_sites_created_at" ON "saved_sites" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_saved_sites_workspace_id" ON "saved_sites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_security_rules_type" ON "security_rules" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_security_rules_active" ON "security_rules" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_security_rules_priority" ON "security_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_security_rules_expires_at" ON "security_rules" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_security_rules_created_by" ON "security_rules" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_id" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_plan" ON "subscriptions" USING btree ("plan_name");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_task_projects_user_id" ON "task_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_id" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_project_id" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_is_completed" ON "tasks" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "idx_tasks_is_today" ON "tasks" USING btree ("is_today");--> statement-breakpoint
CREATE INDEX "idx_templates_slug" ON "templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_templates_category" ON "templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_user_notifications_user_id" ON "user_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_notifications_read" ON "user_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "idx_user_notifications_created_at" ON "user_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_subscription_plan" ON "users" USING btree ("subscription_plan");--> statement-breakpoint
CREATE INDEX "idx_users_subscription_status" ON "users" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "idx_users_stripe_customer_id" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_is_blocked" ON "users" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX "idx_workspace_projects_user_id" ON "workspace_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_projects_workspace_id" ON "workspace_projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_projects_is_archived" ON "workspace_projects" USING btree ("is_archived");