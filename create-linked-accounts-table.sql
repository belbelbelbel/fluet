-- Create linked_accounts table for storing OAuth tokens (YouTube, Twitter, etc.)
-- Note: account_id is optional and can be set later after fetching channel/user info
CREATE TABLE IF NOT EXISTS "linked_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "platform" varchar(50) NOT NULL,
  "account_id" text,
  "account_username" text,
  "access_token" text,
  "refresh_token" text,
  "token_expires_at" timestamp,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "linked_accounts" 
ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("id") 
ON DELETE no action 
ON UPDATE no action;
