import { z } from 'zod';

export const agentProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  latinName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  photoUrl: z.string().url().max(500).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().min(5).max(40).optional(),
  licenseType: z.string().trim().max(120).optional(),
  licenseNumber: z.string().trim().max(120).optional(),
});

export type AgentProfileInput = z.infer<typeof agentProfileSchema>;

/** When an agent submits for verification, only request a subset is mutable here. */
export const agentVerificationSubmissionSchema = z.object({
  licenseType: z.string().trim().min(2).max(120),
  licenseNumber: z.string().trim().min(2).max(120),
});

export type AgentVerificationSubmission = z.infer<typeof agentVerificationSubmissionSchema>;
