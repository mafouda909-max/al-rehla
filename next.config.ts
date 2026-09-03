import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the existing static prototype served from /public so the preserved
  // pages (tickets.html, visas.html, request.html, ...) remain usable while we
  // progressively wire them to the real backend.
  images: {
    // Allow dynamic image hosts for agent logos/photos in the future.
    remotePatterns: [],
  },
  async headers() {
    const securityHeaders: Record<string, string> = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-DNS-Prefetch-Control': 'on',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    };
    // HSTS only over HTTPS in production.
    if (isProduction) {
      securityHeaders['Strict-Transport-Security'] =
        'max-age=63072000; includeSubDomains; preload';
    }
    return [
      {
        source: '/(.*)',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
