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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // mora-hueso-blob (IAD1)
      {
        protocol: "https",
        hostname: "x1ufds0is3katagw.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
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
