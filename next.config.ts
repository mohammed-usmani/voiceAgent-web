import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Gzip can hold back server-sent events, and this app only runs locally.
  compress: false,
};

export default config;
