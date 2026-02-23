-- Add AI cost tracking columns to generated_content
-- Run this if you prefer manual migration over drizzle-kit push
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS ai_tokens_used integer;
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS ai_cost_usd real;
