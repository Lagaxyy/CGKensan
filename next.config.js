const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Auth.js fonctionne mieux avec cette config en standalone
    serverComponentsExternalPackages: ['@prisma/client'],
    instrumentationHook: true
  },
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "lagaxyy",
  project: "cgkensan"
});
