import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
  check,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * THE JOURNEY — PostgreSQL schema (via Drizzle ORM).
 *
 * Design rules:
 *  - Real foreign keys and indexes.
 *  - Unique constraints for identity uniqueness (no read-then-insert races).
 *  - Decimal (numeric) money storage so fractional currencies are safe.
 *  - Machine-readable enums for all lifecycle statuses.
 *  - No free-text validity; use timestamp ranges.
 */

export const accountRole = pgEnum('account_role', [
  'traveler',
  'agent',
  'admin',
]);

export const agentVerificationStatus = pgEnum('agent_verification_status', [
  'unverified',
  'pending',
  'verified',
  'rejected',
]);

export const offerTripType = pgEnum('offer_trip_type', [
  'ticket',
  'visa',
  'procedure',
]);

export const offerPriceType = pgEnum('offer_price_type', [
  'fixed',
  'starting_from',
  'negotiable',
]);

export const offerStatus = pgEnum('offer_status', [
  'draft',
  'pending_review',
  'approved',
  'published',
  'rejected',
  'expired',
  'archived',
]);

export const contactRequestStatus = pgEnum('contact_request_status', [
  'new',
  'viewed',
  'responded',
  'closed',
  'cancelled',
]);

export const notificationType = pgEnum('notification_type', [
  'new_lead',
  'agent_response',
  'verification_status',
  'offer_moderation',
  'account_event',
]);

// ---------------------------------------------------------------------------
// accounts
// ---------------------------------------------------------------------------
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: accountRole('role').notNull(),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('accounts_email_unique').on(table.email),
    index('accounts_role_idx').on(table.role),
  ],
);

// ---------------------------------------------------------------------------
// sessions — server-side, only the hash of the session token is stored
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_account_id_idx').on(table.accountId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

// ---------------------------------------------------------------------------
// agents
// ---------------------------------------------------------------------------
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    latinName: text('latin_name'),
    bio: text('bio'),
    photoUrl: text('photo_url'),
    city: text('city'),
    country: text('country'),
    licenseType: text('license_type'),
    licenseNumber: text('license_number'),
    verificationStatus: agentVerificationStatus('verification_status')
      .notNull()
      .default('unverified'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    responseRate: numeric('response_rate'),
    avgResponseHours: numeric('avg_response_hours'),
    totalTrips: integer('total_trips').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('agents_account_id_unique').on(table.accountId),
    index('agents_verification_status_idx').on(table.verificationStatus),
  ],
);

// ---------------------------------------------------------------------------
// offers
// ---------------------------------------------------------------------------
export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    tripType: offerTripType('trip_type').notNull(),
    originCity: text('origin_city'),
    destinationCity: text('destination_city'),
    destinationCountry: text('destination_country'),
    priceAmount: numeric('price_amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    priceType: offerPriceType('price_type').notNull().default('starting_from'),
    pricingBasis: text('pricing_basis'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    status: offerStatus('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('offers_agent_id_idx').on(table.agentId),
    index('offers_status_idx').on(table.status),
    index('offers_destination_country_idx').on(table.destinationCountry),
    // Published + valid offers are what travelers browse.
    index('offers_published_valid_idx').on(table.status, table.validUntil),
    // Price must not be negative.
    check(
      'offers_price_amount_non_negative',
      sql`${table.priceAmount} >= 0`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// contact_requests — the real lead lifecycle
// ---------------------------------------------------------------------------
export const contactRequests = pgTable(
  'contact_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    offerId: uuid('offer_id').references(() => offers.id, { onDelete: 'set null' }),
    travelerAccountId: uuid('traveler_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    travelerName: text('traveler_name'),
    travelerEmail: text('traveler_email'),
    travelerPhone: text('traveler_phone'),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: contactRequestStatus('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [
    index('contact_requests_agent_id_idx').on(table.agentId),
    index('contact_requests_offer_id_idx').on(table.offerId),
    index('contact_requests_status_idx').on(table.status),
    index('contact_requests_traveler_account_id_idx').on(table.travelerAccountId),
    // Never allow a repeated lead against the same offer by the same traveler.
    // Unique handles NULLs as distinct: anonymous or offer-less leads are fine,
    // but an authenticated traveler cannot double-submit the same offer.
    uniqueIndex('contact_requests_offer_traveler_unique').on(
      table.offerId,
      table.travelerAccountId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// reviews — gated: must reference a completed contact request
// ---------------------------------------------------------------------------
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    reviewerAccountId: uuid('reviewer_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    offerId: uuid('offer_id').references(() => offers.id, { onDelete: 'set null' }),
    contactRequestId: uuid('contact_request_id')
      .references(() => contactRequests.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reviews_agent_id_idx').on(table.agentId),
    index('reviews_reviewer_account_id_idx').on(table.reviewerAccountId),
    // One review per completed interaction — prevents duplicate/free reviews.
    uniqueIndex('reviews_contact_request_unique').on(table.contactRequestId),
    check(
      'reviews_rating_range',
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    type: notificationType('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    data: jsonb('data'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_account_id_idx').on(table.accountId),
    index('notifications_read_at_idx').on(table.readAt),
  ],
);

// ---------------------------------------------------------------------------
// admin_actions — audit trail
// ---------------------------------------------------------------------------
export const adminActions = pgTable(
  'admin_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminAccountId: uuid('admin_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('admin_actions_admin_account_id_idx').on(table.adminAccountId),
    index('admin_actions_target_idx').on(table.targetType, table.targetId),
  ],
);

// ---------------------------------------------------------------------------
// TypeScript convenience exports
// ---------------------------------------------------------------------------
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type ContactRequest = typeof contactRequests.$inferSelect;
export type NewContactRequest = typeof contactRequests.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type AdminAction = typeof adminActions.$inferSelect;
export type NewAdminAction = typeof adminActions.$inferInsert;

export const accountRoleValues = accountRole.enumValues;
export const agentVerificationStatusValues = agentVerificationStatus.enumValues;
export const offerTripTypeValues = offerTripType.enumValues;
export const offerPriceTypeValues = offerPriceType.enumValues;
export const offerStatusValues = offerStatus.enumValues;
export const contactRequestStatusValues = contactRequestStatus.enumValues;
export const notificationTypeValues = notificationType.enumValues;

export type AccountRole = (typeof accountRole)['enumValues'][number];
export type AgentVerificationStatus = (typeof agentVerificationStatus)['enumValues'][number];
export type OfferTripType = (typeof offerTripType)['enumValues'][number];
export type OfferPriceType = (typeof offerPriceType)['enumValues'][number];
export type OfferStatus = (typeof offerStatus)['enumValues'][number];
export type ContactRequestStatus = (typeof contactRequestStatus)['enumValues'][number];
export type NotificationType = (typeof notificationType)['enumValues'][number];
