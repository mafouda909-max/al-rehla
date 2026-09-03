import { defineConfig } from 'drizzle-kit';

/**
 * Normalize DATABASE_URL for drizzle-kit:
 * drop `channel_binding` (not reliably completed by node-postgres) so the
 * migration connection doesn't abort at startup. `sslmode=require` stays so
 * TLS is used against the Neon pooler.
 */
function normalizeDbUrl(url?: string): string {
  if (!url) return 'postgres://postgres:postgres@localhost:5432/al_rehla';
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: normalizeDbUrl(process.env.DATABASE_URL),
  },
  strict: true,
  verbose: true,
});
