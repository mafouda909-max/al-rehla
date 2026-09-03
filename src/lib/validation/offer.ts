import { z } from 'zod';
import { offerTripTypeValues, offerPriceTypeValues } from '@/lib/db/schema';

// Decimal string (e.g. "8450.00" or "8450") so fractional currency is safe.
const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'priceAmount must be a decimal string like "8450.00"')
  .refine((v) => Number(v) >= 0, 'priceAmount must not be negative');

export const offerCreateSchema = z.object({
  agentId: z.string().uuid(), // must equal the authenticated agent's own agentId
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).optional(),
  tripType: z.enum(offerTripTypeValues),
  originCity: z.string().trim().max(120).optional(),
  destinationCity: z.string().trim().max(120).optional(),
  destinationCountry: z.string().trim().max(120).optional(),
  priceAmount: moneySchema,
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((s) => s.toUpperCase()),
  priceType: z.enum(offerPriceTypeValues).default('starting_from'),
  pricingBasis: z.string().trim().max(120).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export type OfferCreateInput = z.infer<typeof offerCreateSchema>;

export const offerUpdateSchema = offerCreateSchema.partial();

export type OfferUpdateInput = z.infer<typeof offerUpdateSchema>;

export const offerSubmissionSchema = z.object({
  offerId: z.string().uuid(),
});

export type OfferSubmissionInput = z.infer<typeof offerSubmissionSchema>;
