CREATE TYPE "public"."account_role" AS ENUM('traveler', 'agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."agent_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contact_request_status" AS ENUM('new', 'viewed', 'responded', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_lead', 'agent_response', 'verification_status', 'offer_moderation', 'account_event');--> statement-breakpoint
CREATE TYPE "public"."offer_price_type" AS ENUM('fixed', 'starting_from', 'negotiable');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'pending_review', 'approved', 'published', 'rejected', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."offer_trip_type" AS ENUM('ticket', 'visa', 'procedure');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "account_role" NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_account_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"latin_name" text,
	"bio" text,
	"photo_url" text,
	"city" text,
	"country" text,
	"license_type" text,
	"license_number" text,
	"verification_status" "agent_verification_status" DEFAULT 'unverified' NOT NULL,
	"verified_at" timestamp with time zone,
	"response_rate" numeric,
	"avg_response_hours" numeric,
	"total_trips" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid,
	"traveler_account_id" uuid,
	"traveler_name" text,
	"traveler_email" text,
	"traveler_phone" text,
	"agent_id" uuid NOT NULL,
	"message" text,
	"status" "contact_request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"viewed_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"trip_type" "offer_trip_type" NOT NULL,
	"origin_city" text,
	"destination_city" text,
	"destination_country" text,
	"price_amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"price_type" "offer_price_type" DEFAULT 'starting_from' NOT NULL,
	"pricing_basis" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_price_amount_non_negative" CHECK ("offers"."price_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"reviewer_account_id" uuid NOT NULL,
	"offer_id" uuid,
	"contact_request_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_account_id_accounts_id_fk" FOREIGN KEY ("admin_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_traveler_account_id_accounts_id_fk" FOREIGN KEY ("traveler_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_account_id_accounts_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contact_request_id_contact_requests_id_fk" FOREIGN KEY ("contact_request_id") REFERENCES "public"."contact_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_email_unique" ON "accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "accounts_role_idx" ON "accounts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admin_actions_admin_account_id_idx" ON "admin_actions" USING btree ("admin_account_id");--> statement-breakpoint
CREATE INDEX "admin_actions_target_idx" ON "admin_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_account_id_unique" ON "agents" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "agents_verification_status_idx" ON "agents" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "contact_requests_agent_id_idx" ON "contact_requests" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "contact_requests_offer_id_idx" ON "contact_requests" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "contact_requests_status_idx" ON "contact_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_requests_traveler_account_id_idx" ON "contact_requests" USING btree ("traveler_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_requests_offer_traveler_unique" ON "contact_requests" USING btree ("offer_id","traveler_account_id");--> statement-breakpoint
CREATE INDEX "notifications_account_id_idx" ON "notifications" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "offers_agent_id_idx" ON "offers" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "offers_destination_country_idx" ON "offers" USING btree ("destination_country");--> statement-breakpoint
CREATE INDEX "offers_published_valid_idx" ON "offers" USING btree ("status","valid_until");--> statement-breakpoint
CREATE INDEX "reviews_agent_id_idx" ON "reviews" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "reviews_reviewer_account_id_idx" ON "reviews" USING btree ("reviewer_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_contact_request_unique" ON "reviews" USING btree ("contact_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_account_id_idx" ON "sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");