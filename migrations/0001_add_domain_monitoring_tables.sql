-- Domain Monitoring tables (fixes GET/POST /api/domains 500 errors)
CREATE TABLE IF NOT EXISTS "monitored_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"domain" text NOT NULL,
	"registrar" text,
	"expiry_date" timestamp,
	"created_date" timestamp,
	"updated_date" timestamp,
	"name_servers" jsonb DEFAULT '[]'::jsonb,
	"whois_data" jsonb DEFAULT '{}'::jsonb,
	"ssl_issuer" text,
	"ssl_expiry_date" timestamp,
	"ssl_valid_from" timestamp,
	"ssl_data" jsonb DEFAULT '{}'::jsonb,
	"dns_records" jsonb DEFAULT '{}'::jsonb,
	"last_checked_at" timestamp,
	"alert_days" jsonb DEFAULT '[30, 15, 7, 1]'::jsonb,
	"alerts_enabled" boolean DEFAULT true,
	"alert_email" text,
	"notes" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_domain_unique" UNIQUE("user_id","domain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "domain_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"snapshot_type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"changes" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "domain_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"message" text NOT NULL,
	"days_until_expiry" integer,
	"sent_at" timestamp,
	"acknowledged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "domain_snapshots" ADD CONSTRAINT "domain_snapshots_domain_id_monitored_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."monitored_domains"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "domain_alerts" ADD CONSTRAINT "domain_alerts_domain_id_monitored_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."monitored_domains"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitored_domains_user_id" ON "monitored_domains" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitored_domains_domain" ON "monitored_domains" USING btree ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitored_domains_expiry_date" ON "monitored_domains" USING btree ("expiry_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitored_domains_ssl_expiry" ON "monitored_domains" USING btree ("ssl_expiry_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_snapshots_domain_id" ON "domain_snapshots" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_snapshots_type" ON "domain_snapshots" USING btree ("snapshot_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_snapshots_created_at" ON "domain_snapshots" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_alerts_domain_id" ON "domain_alerts" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_alerts_type" ON "domain_alerts" USING btree ("alert_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_alerts_sent_at" ON "domain_alerts" USING btree ("sent_at");
