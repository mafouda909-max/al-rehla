import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/validation/auth';
import { offerCreateSchema } from '@/lib/validation/offer';
import { contactRequestCreateSchema, contactRequestRespondSchema } from '@/lib/validation/contact-request';

describe('auth validation', () => {
  it('accepts a valid agent registration', () => {
    const res = registerSchema.safeParse({
      email: 'agent@example.com',
      password: 'password123',
      displayName: 'مكتب النخبة',
      role: 'agent',
      agent: { city: 'القاهرة', country: 'مصر' },
    });
    expect(res.success).toBe(true);
  });

  it('rejects a short password', () => {
    const res = registerSchema.safeParse({
      email: 'x@example.com',
      password: 'short',
      displayName: 'Test',
    });
    expect(res.success).toBe(false);
  });

  it('rejects an invalid role', () => {
    const res = registerSchema.safeParse({
      email: 'x@example.com',
      password: 'password123',
      displayName: 'Test',
      role: 'superuser',
    });
    expect(res.success).toBe(false);
  });

  it('accepts a valid login schema', () => {
    const res = loginSchema.safeParse({ email: 'a@b.com', password: 'pw' });
    expect(res.success).toBe(true);
  });
});

describe('offer validation', () => {
  it('accepts a valid offer', () => {
    const res = offerCreateSchema.safeParse({
      agentId: '11111111-1111-1111-1111-111111111111',
      title: 'القاهرة إلى الرياض',
      tripType: 'ticket',
      destinationCountry: 'السعودية',
      priceAmount: '8450.00',
      currency: 'egp', // upper-cased by transform
      priceType: 'starting_from',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.currency).toBe('EGP');
    }
  });

  it('rejects a negative price', () => {
    const res = offerCreateSchema.safeParse({
      agentId: '11111111-1111-1111-1111-111111111111',
      title: 'Bad',
      tripType: 'visa',
      priceAmount: '-5',
      currency: 'EGP',
    });
    expect(res.success).toBe(false);
  });
});

describe('contact request validation', () => {
  it('accepts a valid contact request', () => {
    const res = contactRequestCreateSchema.safeParse({
      agentId: '22222222-2222-2222-2222-222222222222',
      name: 'أحمد',
      email: 'ahmed@example.com',
      phone: '01000000000',
      message: 'أبحث عن تذكرة',
    });
    expect(res.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const res = contactRequestCreateSchema.safeParse({
      agentId: '22222222-2222-2222-2222-222222222222',
      name: 'أحمد',
      email: 'not-an-email',
      phone: '01000000000',
      message: 'message',
    });
    expect(res.success).toBe(false);
  });

  it('accepts a response schema', () => {
    const res = contactRequestRespondSchema.safeParse({ response: 'تفاصيل العرض' });
    expect(res.success).toBe(true);
  });
});
