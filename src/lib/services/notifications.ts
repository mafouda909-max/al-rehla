import { and, desc, eq, isNull } from 'drizzle-orm';
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

/** List a user's notifications, newest first. Limit optional (default 50). */
export async function listNotifications(accountId: string, limit = 50) {
  return db()
    .select()
    .from(notifications)
    .where(eq(notifications.accountId, accountId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/** List only unread notifications. */
export async function listUnreadNotifications(accountId: string) {
  return db()
    .select()
    .from(notifications)
    .where(and(eq(notifications.accountId, accountId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt));
}

/** Mark a notification as read. */
export async function markNotificationRead(accountId: string, notificationId: string) {
  return db()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.accountId, accountId)))
    .returning();
}
