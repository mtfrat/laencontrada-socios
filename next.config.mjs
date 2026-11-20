/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  serverExternalPackages: ['pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/pos/cierre/preview': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
    '/api/pos/cierre/acreditar': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  },
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
