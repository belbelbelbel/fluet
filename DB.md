# Database

## Sync schema to your database

After pulling schema changes (e.g. `generated_content.client_id`, `client_reports`, etc.), sync your DB:

```bash
npm run db:push
```

This runs Drizzle’s push against your configured database (e.g. Neon). Ensure `DATABASE_URL` is set in `.env`.

## Optional: run SQL manually

If you prefer not to use `db:push`, you can run migrations manually in your SQL client (e.g. Neon console):

- **`generated_content.client_id`** – see `add-generated-content-client-id.sql` if the column is missing.
