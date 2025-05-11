import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Vercel을 포함한 production 빌드에서 Lint 에러가 나도 빌드가 멈추지 않음
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
