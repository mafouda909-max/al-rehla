import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import type { NotificationType } from '@/lib/db/schema';

export async function createNotification(accountId: string, data: {
  type: NotificationType;
  title: string;
  body?: string;
  details?: Record<string, unknown>;
}) {
  const rows = await db()
    .insert(notifications)
    .values({
      accountId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      data: data.details ?? null,
      createdAt: new Date(),
    })
    .returning();
  return rows[0];
}
