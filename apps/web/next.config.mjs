/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  output: 'standalone',
  async redirects() {
    return [
      // Serve the static preview index when visiting /preview
      { source: '/preview', destination: '/preview/index.html', permanent: false }
    ];
  }
};

export default nextConfig;