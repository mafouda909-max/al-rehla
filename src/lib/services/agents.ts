import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import type { AgentProfileInput } from '@/lib/validation/agent';

export async function getVerifiedAgent(agentId: string) {
  const rows = await db()
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.verificationStatus, 'verified')))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAgentByAccountId(accountId: string) {
  const rows = await db()
    .select()
    .from(agents)
    .where(eq(agents.accountId, accountId))
    .limit(1);
  return rows[0] ?? null;
}

/** Public projection of an agent's profile (no license/account/internal fields). */
export function toPublicAgent(agent: {
  id: string;
  displayName: string;
  latinName: string | null;
  bio: string | null;
  photoUrl: string | null;
  city: string | null;
  country: string | null;
  contactPhone: string | null;
  verificationStatus: string;
  responseRate: string | null;
  avgResponseHours: string | null;
  totalTrips: number;
  joinedAt: Date;
}) {
  return {
    id: agent.id,
    displayName: agent.displayName,
    latinName: agent.latinName,
    bio: agent.bio,
    photoUrl: agent.photoUrl,
    city: agent.city,
    country: agent.country,
    contactPhone: agent.contactPhone,
    verificationStatus: agent.verificationStatus,
    responseRate: agent.responseRate,
    avgResponseHours: agent.avgResponseHours,
    totalTrips: agent.totalTrips,
    joinedAt: agent.joinedAt,
  };
}

export async function createAgentProfile(accountId: string, input: AgentProfileInput) {
  const existing = await getAgentByAccountId(accountId);
  if (existing) {
    throw new HttpError(409, 'agent_exists', 'An agent profile already exists for this account');
  }

  const rows = await db()
    .insert(agents)
    .values({
      accountId,
      displayName: input.displayName,
      latinName: input.latinName ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl || null,
      city: input.city ?? null,
      country: input.country ?? null,
      contactPhone: input.contactPhone ?? null,
      licenseType: input.licenseType ?? null,
      licenseNumber: input.licenseNumber ?? null,
      verificationStatus: 'unverified',
      totalTrips: 0,
    })
    .returning();

  return rows[0];
}

export async function updateAgentProfile(accountId: string, input: AgentProfileInput) {
  const existing = await getAgentByAccountId(accountId);
  if (!existing) {
    throw new HttpError(404, 'agent_not_found', 'No agent profile found for this account');
  }

  const rows = await db()
    .update(agents)
    .set({
      displayName: input.displayName,
      latinName: input.latinName ?? existing.latinName,
      bio: input.bio ?? existing.bio,
      photoUrl: input.photoUrl || existing.photoUrl,
      city: input.city ?? existing.city,
      country: input.country ?? existing.country,
      contactPhone: input.contactPhone ?? existing.contactPhone,
      licenseType: input.licenseType ?? existing.licenseType,
      licenseNumber: input.licenseNumber ?? existing.licenseNumber,
      updatedAt: new Date(),
    })
    .where(eq(agents.accountId, accountId))
    .returning();

  return rows[0];
}
