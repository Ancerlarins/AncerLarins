import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.ancerlarins.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'pictures-nigeria.jijistatic.net' },
      { protocol: 'https', hostname: 'images.propertypro.ng' },
      { protocol: 'https', hostname: 'www.propertypro.ng' },
      { protocol: 'https', hostname: 'images.nigeriapropertycentre.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // In development, skip image optimization to avoid private IP blocking for local backend
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    // CSP is handled dynamically in middleware.ts (nonce-based)
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Skip source map upload when no auth token is set (local dev)
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
