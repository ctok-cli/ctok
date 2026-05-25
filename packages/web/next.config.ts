import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Next 15 emits LayoutProps generated types that conflict with React 19's
  // ReactNode in the .next/types tree. Tracked upstream; runtime is unaffected.
  // Re-enable once Next 15.4+ ships the fix.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
