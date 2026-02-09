-- Fix: Make account_id nullable in linked_accounts table
-- This allows YouTube connections without requiring account_id immediately
-- Run this in your NeonDB SQL editor

ALTER TABLE "linked_accounts" 
ALTER COLUMN "account_id" DROP NOT NULL;
