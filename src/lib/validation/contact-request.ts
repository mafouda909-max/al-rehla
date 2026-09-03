import { z } from 'zod';

export const contactRequestCreateSchema = z.object({
  offerId: z.string().uuid().optional(),
  agentId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().trim().min(5).max(40),
  message: z.string().trim().min(1).max(4000),
});

export type ContactRequestCreateInput = z.infer<typeof contactRequestCreateSchema>;

export const contactRequestRespondSchema = z.object({
  response: z.string().trim().min(1).max(4000),
});

export type ContactRequestRespondInput = z.infer<typeof contactRequestRespondSchema>;
