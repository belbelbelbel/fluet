-- Add client_id to generated_content so content can be saved per client.
-- Run this in Neon SQL editor if you don't use db:push.

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generated_content_client_id ON generated_content(client_id);
