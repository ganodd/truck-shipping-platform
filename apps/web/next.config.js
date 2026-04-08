/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@truck-shipping/shared-types',
    '@truck-shipping/shared-validators',
    '@truck-shipping/shared-utils',
  ],
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
