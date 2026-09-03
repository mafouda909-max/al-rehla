import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Normalize a DATABASE_URL for node-postgres.
 *
 * - `channel_binding=require` is not reliably completed by node-postgres and
 *   can abort the connection at startup; we drop it (the server still uses
 *   SCRAM, just not channel-bound).
 * - Neon pooler uses TLS; we force SSL with a permissive verification so the
 *   connect works across Neon's pooler endpoint without a custom CA bundle.
 */
function normalizedDbConfig(url?: string) {
  if (!url) return { connectionString: url, ssl: undefined };
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    return {
      connectionString: u.toString(),
      ssl: { rejectUnauthorized: false } as const,
    };
  } catch {
    return { connectionString: url, ssl: { rejectUnauthorized: false } as const };
  }
}

/**
 * PostgreSQL connection pool via node-postgres + Drizzle.
 *
 * Uses a global singleton so Hot Module Replacement doesn't exhaust the
 * connection pool during development.
 */

const globalForDb = globalThis as unknown as {
  __rehlaPool: Pool | undefined;
  __rehlaDb: ReturnType<typeof createDb> | undefined;
};

function createPool() {
  const config = normalizedDbConfig(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  // Avoid keeping the event loop alive strictly because of idle clients.
  pool.on('error', (err) => {
    console.error('[db] idle client error', err);
  });
  return pool;
}

function createDb(pool: Pool) {
  return drizzle(pool, { schema });
}

export function db() {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is not set');
    }
    // In dev/test without a DB, return a non-connected Drizzle object.
    // (Calls against it will fail at query time, which is expected when
    // PostgreSQL isn't configured yet.)
  }
  if (!globalForDb.__rehlaPool) {
    globalForDb.__rehlaPool = createPool();
  }
  if (!globalForDb.__rehlaDb) {
    globalForDb.__rehlaDb = createDb(globalForDb.__rehlaPool);
  }
  return globalForDb.__rehlaDb;
}

export type Database = ReturnType<typeof db>;
export { schema };

/** Lightweight connectivity probe for /api/health. */
export async function checkDatabase(): Promise<boolean> {
  try {
    const pool = globalForDb.__rehlaPool ?? createPool();
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
