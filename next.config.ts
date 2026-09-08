import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.trucksizer.com',
          },
        ],
        destination: 'https://trucksizer.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
