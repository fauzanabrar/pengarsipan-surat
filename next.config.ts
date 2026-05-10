import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Reduced from 100mb for better server stability, 10mb is usually plenty for PDFs/docs
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Optimize production builds
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
