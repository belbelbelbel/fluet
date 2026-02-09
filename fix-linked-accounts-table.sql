-- Fix linked_accounts table: Make account_id nullable
-- Run this in your NeonDB console

ALTER TABLE "linked_accounts" 
ALTER COLUMN "account_id" DROP NOT NULL;
