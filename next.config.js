/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Allow Cloud Agent public tunnels (iPad / mobile preview)
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "loca.lt",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./node_modules/.prisma/client-v2/**"],
    },
  },
  webpack: (config) => {
    config.resolve.alias["@prisma-client"] = path.resolve(
      __dirname,
      "node_modules/.prisma/client-v2"
    );
    return config;
  },
};

module.exports = nextConfig;
