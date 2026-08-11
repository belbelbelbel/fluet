-- Phase 1: persist account settings
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  default_ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  auto_save BOOLEAN DEFAULT true,
  notifications BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'system',
  niche VARCHAR(100),
  email_approvals BOOLEAN DEFAULT true,
  email_tasks BOOLEAN DEFAULT true,
  default_requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
