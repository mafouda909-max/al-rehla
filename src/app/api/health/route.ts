import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * GET /api/health
 * Lightweight liveness/probe endpoint. Reports DB connectivity without
 * throwing if PostgreSQL isn't configured — useful for load balancers and
 * to confirm the API layer is up while the DB dependency is being set up.
 */
export async function GET() {
  const dbUp = await checkDatabase();
  return NextResponse.json(
    {
      ok: true,
      service: 'al-rehla-api',
      time: new Date().toISOString(),
      environment: env().NODE_ENV,
      database: dbUp ? 'connected' : 'unavailable',
    },
    { status: 200 },
  );
}
