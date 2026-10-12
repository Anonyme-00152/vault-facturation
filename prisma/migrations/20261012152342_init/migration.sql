-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPTABLE', 'LECTEUR');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('ENTREPRISE', 'PARTICULIER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_LOCKED', 'LOGOUT', 'SESSION_EXPIRED', 'MFA_ENROLLED', 'MFA_SUCCESS', 'MFA_FAILURE', 'MFA_RESET', 'BACKUP_CODE_USED', 'BACKUP_CODES_REGENERATED', 'PASSWORD_CHANGED', 'CHARTER_ACCEPTED', 'CHARTER_PUBLISHED', 'ACCESS_DENIED', 'CLIENT_VIEWED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'CLIENT_ANONYMIZED', 'CLIENT_EXPORTED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_DELETED', 'INVOICE_ISSUED', 'INVOICE_STATUS_CHANGED', 'INVOICE_PDF_EXPORTED', 'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'USER_ENABLED', 'AUDIT_EXPORTED', 'AUDIT_VERIFIED', 'RETENTION_PURGE', 'SETTINGS_UPDATED', 'DEMO_RESET');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "totp_secret_enc" TEXT,
    "totp_enabled_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "mfa_verified_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_versions" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_id" UUID,

    CONSTRAINT "charter_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_acceptances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "charter_version_id" UUID NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "charter_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "type" "ClientType" NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT,
    "vat_number" TEXT,
    "email_enc" TEXT,
    "email_hash" TEXT,
    "phone_enc" TEXT,
    "address_enc" TEXT,
    "payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymized_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "number" TEXT,
    "year" INTEGER,
    "sequence" INTEGER,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "client_id" UUID NOT NULL,
    "issue_date" DATE,
    "service_date" DATE,
    "due_date" DATE NOT NULL,
    "total_ht_cents" INTEGER NOT NULL DEFAULT 0,
    "total_vat_cents" INTEGER NOT NULL DEFAULT 0,
    "total_ttc_cents" INTEGER NOT NULL DEFAULT 0,
    "client_snapshot_enc" TEXT,
    "seller_snapshot" JSONB,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "quantity_milli" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "vat_rate_bp" INTEGER NOT NULL,
    "total_ht_cents" INTEGER NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,
    "actor_label" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "prev_hash" TEXT NOT NULL DEFAULT '',
    "hash" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" TEXT NOT NULL,
    "legal_form" TEXT NOT NULL,
    "share_capital_cents" INTEGER NOT NULL,
    "siren" TEXT NOT NULL,
    "rcs" TEXT NOT NULL,
    "vat_number" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "postal_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "late_penalty_rate_bp" INTEGER NOT NULL DEFAULT 1215,
    "client_retention_months" INTEGER NOT NULL DEFAULT 36,
    "invoice_retention_years" INTEGER NOT NULL DEFAULT 10,
    "audit_retention_months" INTEGER NOT NULL DEFAULT 12,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "backup_codes_user_id_code_hash_key" ON "backup_codes"("user_id", "code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "charter_versions_version_key" ON "charter_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "charter_acceptances_user_id_charter_version_id_key" ON "charter_acceptances"("user_id", "charter_version_id");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_email_hash_idx" ON "clients"("email_hash");

-- CreateIndex
CREATE INDEX "clients_last_activity_at_idx" ON "clients"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_status_due_date_idx" ON "invoices"("status", "due_date");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoices_issue_date_idx" ON "invoices"("issue_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_year_sequence_key" ON "invoices"("year", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_lines_invoice_id_position_key" ON "invoice_lines"("invoice_id", "position");

-- CreateIndex
CREATE INDEX "audit_log_at_idx" ON "audit_log"("at");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_codes" ADD CONSTRAINT "backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_versions" ADD CONSTRAINT "charter_versions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_acceptances" ADD CONSTRAINT "charter_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_acceptances" ADD CONSTRAINT "charter_acceptances_charter_version_id_fkey" FOREIGN KEY ("charter_version_id") REFERENCES "charter_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
