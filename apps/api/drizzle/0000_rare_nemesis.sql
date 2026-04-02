CREATE TYPE "public"."generation_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'agency');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('minimal', 'vibrant', 'corporate', 'lifestyle', 'dark');--> statement-breakpoint
CREATE TABLE "brand_kits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#6D28D9' NOT NULL,
	"secondary_color" text DEFAULT '#1E1B4B' NOT NULL,
	"accent_color" text DEFAULT '#F59E0B' NOT NULL,
	"heading_font" text DEFAULT 'Inter' NOT NULL,
	"body_font" text DEFAULT 'Inter' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"topic" text,
	"slides" jsonb NOT NULL,
	"template_id" uuid,
	"figma_file_url" text,
	"figma_file_key" text,
	"status" "generation_status" DEFAULT 'queued' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "template_category" NOT NULL,
	"preview_url" text,
	"figma_component_key" text,
	"is_pro" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"google_id" text,
	"figma_access_token" text,
	"figma_refresh_token" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"carousels_used" integer DEFAULT 0 NOT NULL,
	"carousels_limit" integer DEFAULT 3 NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousels" ADD CONSTRAINT "carousels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousels" ADD CONSTRAINT "carousels_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;