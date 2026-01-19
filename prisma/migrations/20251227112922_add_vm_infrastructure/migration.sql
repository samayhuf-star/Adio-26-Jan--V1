-- CreateTable
CREATE TABLE "vms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "aws_instance_id" VARCHAR(255),
    "aws_region" VARCHAR(50) NOT NULL,
    "instance_type" VARCHAR(50) NOT NULL,
    "ami_id" VARCHAR(255) NOT NULL,
    "operating_system" VARCHAR(100) NOT NULL,
    "cpu_cores" INTEGER NOT NULL,
    "memory_gb" INTEGER NOT NULL,
    "storage_gb" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'creating',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_started_at" TIMESTAMPTZ(6),
    "last_stopped_at" TIMESTAMPTZ(6),
    "hourly_rate_cents" INTEGER NOT NULL,
    "monthly_estimate_cents" INTEGER NOT NULL,
    "public_ip" VARCHAR(45),
    "private_ip" VARCHAR(45),
    "rdp_port" INTEGER DEFAULT 3389,
    "ssh_port" INTEGER DEFAULT 22,
    "admin_username" VARCHAR(100),
    "admin_password_hash" VARCHAR(255),
    "ssh_key_pair_name" VARCHAR(255),

    CONSTRAINT "vms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vm_billing_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vm_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "amount_cents" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "billing_period_start" TIMESTAMPTZ(6),
    "billing_period_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_charge_id" VARCHAR(255),

    CONSTRAINT "vm_billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "balance_cents" INTEGER NOT NULL DEFAULT 0,
    "auto_recharge_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_recharge_amount_cents" INTEGER NOT NULL DEFAULT 2000,
    "auto_recharge_threshold_cents" INTEGER NOT NULL DEFAULT 500,
    "stripe_customer_id" VARCHAR(255),
    "default_payment_method_id" VARCHAR(255),
    "spending_limit_cents" INTEGER,
    "daily_limit_cents" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vm_usage_tracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vm_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6),
    "duration_minutes" INTEGER,
    "cpu_usage_percent" DOUBLE PRECISION,
    "memory_usage_percent" DOUBLE PRECISION,
    "network_in_bytes" BIGINT,
    "network_out_bytes" BIGINT,
    "storage_read_bytes" BIGINT,
    "storage_write_bytes" BIGINT,
    "cost_cents" INTEGER,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vm_usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vms_aws_instance_id_key" ON "vms"("aws_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_user_id_key" ON "billing_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key" ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "idx_vms_user_id" ON "vms"("user_id");

-- CreateIndex
CREATE INDEX "idx_vms_workspace_id" ON "vms"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_vms_status" ON "vms"("status");

-- CreateIndex
CREATE INDEX "idx_vms_aws_instance_id" ON "vms"("aws_instance_id");

-- CreateIndex
CREATE INDEX "idx_vms_created_at" ON "vms"("created_at");

-- CreateIndex
CREATE INDEX "idx_vm_billing_records_vm_id" ON "vm_billing_records"("vm_id");

-- CreateIndex
CREATE INDEX "idx_vm_billing_records_user_id" ON "vm_billing_records"("user_id");

-- CreateIndex
CREATE INDEX "idx_vm_billing_records_workspace_id" ON "vm_billing_records"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_vm_billing_records_type" ON "vm_billing_records"("type");

-- CreateIndex
CREATE INDEX "idx_vm_billing_records_created_at" ON "vm_billing_records"("created_at");

-- CreateIndex
CREATE INDEX "idx_billing_accounts_user_id" ON "billing_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_billing_accounts_workspace_id" ON "billing_accounts"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_billing_accounts_stripe_customer_id" ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "idx_vm_usage_tracking_vm_id" ON "vm_usage_tracking"("vm_id");

-- CreateIndex
CREATE INDEX "idx_vm_usage_tracking_user_id" ON "vm_usage_tracking"("user_id");

-- CreateIndex
CREATE INDEX "idx_vm_usage_tracking_workspace_id" ON "vm_usage_tracking"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_vm_usage_tracking_start_time" ON "vm_usage_tracking"("start_time");

-- CreateIndex
CREATE INDEX "idx_vm_usage_tracking_recorded_at" ON "vm_usage_tracking"("recorded_at");

-- AddForeignKey
ALTER TABLE "vms" ADD CONSTRAINT "vms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vms" ADD CONSTRAINT "vms_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_billing_records" ADD CONSTRAINT "vm_billing_records_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "vms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_billing_records" ADD CONSTRAINT "vm_billing_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_billing_records" ADD CONSTRAINT "vm_billing_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_usage_tracking" ADD CONSTRAINT "vm_usage_tracking_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "vms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_usage_tracking" ADD CONSTRAINT "vm_usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vm_usage_tracking" ADD CONSTRAINT "vm_usage_tracking_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;