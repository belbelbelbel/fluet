-- Create tasks table (matches utils/db/schema.ts Tasks)
-- Run this in Neon SQL editor if the table is missing, or use: npm run db:push

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_post_id INTEGER REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'assigned',
  due_date TIMESTAMP,
  description TEXT,
  comments JSONB,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
