import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Use the modern JSX transform
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },
  experimental: {
    // Enable modern JSX transform
    forceSwcTransforms: true,
  },
};

export default nextConfig;

