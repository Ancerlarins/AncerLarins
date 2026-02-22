import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org https://pictures-nigeria.jijistatic.net https://images.propertypro.ng https://www.propertypro.ng https://images.nigeriapropertycentre.com",
          "font-src 'self' data:",
          `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : 'http://localhost:8000'} https://*.sentry.io https://wa.me https://api.paystack.co`,
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
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
