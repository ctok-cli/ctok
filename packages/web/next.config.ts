import type { NextConfig } from "next";

// BASE_PATH lets us serve the same static export from a subpath. Defaults to
// "" so local `pnpm dev`, the Tauri bundle, and `ctok serve` all work at root.
// CI sets BASE_PATH=/ctok/playground when bundling into the GitHub Pages site.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // Next 15 emits LayoutProps generated types that conflict with React 19's
  // ReactNode in the .next/types tree. Tracked upstream; runtime is unaffected.
  // Re-enable once Next 15.4+ ships the fix.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
