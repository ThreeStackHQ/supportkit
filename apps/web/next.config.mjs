/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@supportkit/db"],
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
};

export default nextConfig;
