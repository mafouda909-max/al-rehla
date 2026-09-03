import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateCsrf,
  validateCsrf,
  csrfHeaderName,
} from '@/lib/csrf';

function makeRequest(opts: {
  cookie?: string | null;
  header?: string | null;
  origin?: string | null;
}) {
  const headers = new Headers();
  if (opts.header) headers.set(csrfHeaderName(), opts.header);
  if (opts.origin) headers.set('origin', opts.origin);
  const url = 'http://localhost:3000/api/contacts';
  const req = new NextRequest(url, {
    headers,
  });
  if (opts.cookie) {
    // NextRequest cookies are read-only via .cookies; emulate via Cookie header.
    req.cookies.set('rehla_csrf', opts.cookie);
  }
  return req;
}

describe('CSRF double-submit', () => {
  it('accepts a matching cookie and header', () => {
    const { token } = generateCsrf();
    const req = makeRequest({ cookie: token, header: token, origin: 'http://localhost:3000' });
    expect(validateCsrf(req).ok).toBe(true);
  });

  it('rejects a missing header', () => {
    const { token } = generateCsrf();
    const req = makeRequest({ cookie: token, header: null });
    expect(validateCsrf(req).ok).toBe(false);
  });

  it('rejects a mismatched cookie/header', () => {
    const { token } = generateCsrf();
    const req = makeRequest({ cookie: token, header: 'different', origin: 'http://localhost:3000' });
    expect(validateCsrf(req).ok).toBe(false);
  });

  it('rejects a disallowed origin', () => {
    const { token } = generateCsrf();
    const req = makeRequest({
      cookie: token,
      header: token,
      origin: 'https://evil.example.com',
    });
    expect(validateCsrf(req).ok).toBe(false);
  });
});
