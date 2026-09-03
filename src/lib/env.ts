import { z } from 'zod';

/**
 * Runtime environment validation for THE JOURNEY.
 * This module is hoisted/imported server-side only. It is never imported by
 * client components (it references process.env and is used for API/auth code).
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .regex(/^postgresq?l?(a)?:\/\//, 'DATABASE_URL must be a PostgreSQL connection string'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  ALLOWED_ORIGINS: z.string().optional(),
  DEV_DEBUG: z
    .enum(['0', '1', 'true', 'false'])
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

function buildEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

declare global {
  // eslint-disable-next-line no-var
  var __REHLA_ENV__: Env | undefined;
}

export function env(): Env {
  // Cache across HMR / repeated calls without re-parsing process.env.
  if (globalThis.__REHLA_ENV__) return globalThis.__REHLA_ENV__;
  const parsed = buildEnv();
  globalThis.__REHLA_ENV__ = parsed;
  return parsed;
}

/** Allowed origins as a Set, or null to allow same-origin only. */
export function allowedOriginSet(): Set<string> | null {
  const raw = env().ALLOWED_ORIGINS;
  if (!raw) return null;
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * A safe, minimal boolean for whether to surface stack traces in dev.
 * NEVER touch process.env in client code — this is server-side only.
 */
export function isDevDebug(): boolean {
  return env().DEV_DEBUG === true;
}
