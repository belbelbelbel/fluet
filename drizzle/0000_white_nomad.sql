CREATE TABLE "content_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"platform" varchar(50) NOT NULL,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"engagement_rate" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"prompt" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"tone" varchar(50),
	"style" varchar(50),
	"length" varchar(50),
	"posted" boolean DEFAULT false,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" varchar(50) NOT NULL,
	"account_id" text NOT NULL,
	"account_username" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_id" integer,
	"platform" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"posted" boolean DEFAULT false,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"kora_subscripion_id" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"plan" varchar(50) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp DEFAULT now(),
	"cancel_date" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_customer_Id" text,
	"email" text NOT NULL,
	"name" text,
	"points" integer DEFAULT 50,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "users_stripe_customer_Id_unique" UNIQUE("stripe_customer_Id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_content_id_generated_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."generated_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_content_id_generated_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."generated_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;