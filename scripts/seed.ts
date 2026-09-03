/**
 * THE JOURNEY — safe, idempotent staging seed.
 *
 * Creates (or leaves untouched) three staging accounts:
 *   - admin     (role: admin)
 *   - verified agent (role: agent + agent profile with verificationStatus: verified)
 *   - traveler  (role: traveler)
 *
 * Idempotent: skips any email that already exists. Does NOT drop/wipe/update
 * existing rows. Run with:  npm run db:seed
 *
 * The default passwords are staging-only placeholders. Set the
 * ADMIN_PASSWORD / AGENT_PASSWORD / TRAVELER_PASSWORD env vars to override
 * them in a non-development environment.
 */

import process from 'node:process';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import type { AccountRole } from '@/lib/db/schema';

const { accounts, agents } = schema;

const DEFAULT_PASSWORD = 'ChangeMe_Staging_123';

function passwordFor(envName: string): string {
  const value = process.env[envName];
  return value && value.length >= 8 ? value : DEFAULT_PASSWORD;
}

async function ensureAccount(input: {
  email: string;
  role: AccountRole;
  displayName: string;
  password: string;
}) {
  const existing = await db()
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, input.email))
    .limit(1);

  if (existing.length) {
    console.log(`[seed] account exists, skipping: ${input.email}`);
    return existing[0].id;
  }

  const rows = await db()
    .insert(accounts)
    .values({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      displayName: input.displayName,
    })
    .returning({ id: accounts.id });

  console.log(`[seed] created account: ${input.email} (${input.role})`);
  return rows[0].id;
}

async function ensureVerifiedAgent(accountId: string, displayName: string) {
  const existing = await db()
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.accountId, accountId))
    .limit(1);
  if (existing.length) {
    console.log('[seed] agent profile exists, skipping verification bump');
    return existing[0].id;
  }
  const rows = await db()
    .insert(agents)
    .values({
      accountId,
      displayName,
      city: 'القاهرة',
      country: 'مصر',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      totalTrips: 0,
    })
    .returning({ id: agents.id });
  console.log('[seed] created verified agent profile');
  return rows[0].id;
}

async function main() {
  const adminId = await ensureAccount({
    email: 'admin@thejourney.local',
    role: 'admin',
    displayName: 'إدارة الرحلة',
    password: passwordFor('ADMIN_PASSWORD'),
  });
  const agentId = await ensureAccount({
    email: 'agent@thejourney.local',
    role: 'agent',
    displayName: 'مكتب النخبة للسفر',
    password: passwordFor('AGENT_PASSWORD'),
  });
  const travelerId = await ensureAccount({
    email: 'traveler@thejourney.local',
    role: 'traveler',
    displayName: 'مسافر تجريبي',
    password: passwordFor('TRAVELER_PASSWORD'),
  });

  await ensureVerifiedAgent(agentId, 'مكتب النخبة للسفر');

  console.log('[seed] done. admin=%s agent=%s traveler=%s', adminId, agentId, travelerId);
}

main()
  .then(() => {
    console.log('[seed] complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
