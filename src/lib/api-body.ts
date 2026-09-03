import type { ZodSchema, ZodTypeDef } from 'zod';
import { HttpError } from '@/lib/api-response';

/** Parse a JSON request body and validate it against a Zod schema. */
export async function parseBody<Input>(
  request: Request,
  schema: ZodSchema<Input, ZodTypeDef, unknown>,
): Promise<Input> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON');
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(
      400,
      'validation_error',
      'Invalid request payload',
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
