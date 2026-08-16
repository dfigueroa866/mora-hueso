/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
