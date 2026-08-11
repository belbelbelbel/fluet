-- Twitter metrics sync: store platform post ids + link analytics to scheduled posts

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS external_post_id VARCHAR(255);

ALTER TABLE content_analytics
  ADD COLUMN IF NOT EXISTS scheduled_post_id INTEGER REFERENCES scheduled_posts(id) ON DELETE CASCADE;

ALTER TABLE content_analytics
  ADD COLUMN IF NOT EXISTS external_post_id VARCHAR(255);

-- Allow analytics rows without a GeneratedContent id (auto-posted tweets)
ALTER TABLE content_analytics
  ALTER COLUMN content_id DROP NOT NULL;
