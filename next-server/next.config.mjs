/** @type {import('next').NextConfig} */
const nextConfig = {
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
        fullUrl: true,
      },
    },
    reactStrictMode: true,
    generateEtags: false,
};

export default nextConfig;
