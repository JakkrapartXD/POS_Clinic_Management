import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable HTTPS in development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configure for production HTTPS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Environment-specific configurations
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'https://localhost',
  },

  // External packages for server components
  serverExternalPackages: [],

  // Configure images for HTTPS
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
