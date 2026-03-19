/** @type {import('next').NextConfig} */
const nextConfig = {
    onDemandEntries: {
        // Keep pages in memory longer during dev to reduce route-change recompiles.
        maxInactiveAge: 1000 * 60 * 25,
        pagesBufferLength: 8,
    },
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'devsonghee.com' }],
                destination: 'https://www.devsonghee.com/:path*',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/api/ai/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'unsafe-none',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'cross-origin',
                    },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
          {
            protocol: 'http',
            hostname: 'k.kakaocdn.net',
          },
          {
            protocol: 'https',
            hostname: 'k.kakaocdn.net',
          },
          {
            protocol: 'https',
            hostname: 'post-phinf.pstatic.net',
          },
          {
            protocol: 'https',
            hostname: 'shop-phinf.pstatic.net',
          },
          {
            protocol: 'https',
            hostname: 'mjcong.co.kr',
          },
          {
            protocol: 'https',
            hostname: 'lh3.googleusercontent.com',
          },
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
          },
          {
            protocol: 'http',
            hostname: 'res.cloudinary.com',
          },
          {
            protocol: 'https',
            hostname: 'img1.kakaocdn.net',
          },
          {
            protocol: 'http',
            hostname: 'img1.kakaocdn.net',
          },
        ],
    },
    logging: {
      fetches: {
        fullUrl: process.env.NODE_ENV === 'production',
      },
    },
    reactStrictMode: true,
    generateEtags: false,
    experimental: {
        optimizePackageImports: [
            '@heroui/react',
            'framer-motion',
            'react-icons',
            'react-select',
            '@tanstack/react-query',
        ],
    },
};

module.exports = nextConfig;
