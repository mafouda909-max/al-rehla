import { z } from 'zod';

export const reviewCreateSchema = z.object({
  agentId: z.string().uuid(),
  contactRequestId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const reviewEligibilityQuerySchema = z.object({
  agentId: z.string().uuid().optional(),
  contactRequestId: z.string().uuid().optional(),
});

export type ReviewEligibilityInput = z.infer<typeof reviewEligibilityQuerySchema>;
