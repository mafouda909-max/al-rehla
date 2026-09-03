import { z } from 'zod';
import { accountRoleValues } from '@/lib/db/schema';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password is too long'),
  displayName: z.string().trim().min(1).max(120),
  role: z
    .enum(accountRoleValues, {
      errorMap: () => ({ message: 'role must be one of: traveler, agent, admin' }),
    })
    .default('traveler'),
  // Agent-specific fields when role === 'agent'.
  agent: z
    .object({
      city: z.string().trim().max(120).optional(),
      country: z.string().trim().max(120).optional(),
      specialty: z.string().trim().max(255).optional(),
      licenseType: z.string().trim().max(120).optional(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
