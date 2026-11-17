/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  serverExternalPackages: ['pdfjs-dist'],
  distDir: process.env.LOCAL_REVIEW === 'true' ? '.next-review' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
