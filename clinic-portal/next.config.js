/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:4000/uploads/:path*',
      },
      {
        source: '/patient/uploads/:path*',
        destination: 'http://localhost:4000/patient/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
