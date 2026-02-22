import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  turbopack: {
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;
