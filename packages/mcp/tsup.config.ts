import { defineConfig } from "tsup";

export default defineConfig({
  entry: { server: "src/server.ts" },
  format: ["cjs"],
  dts: false,
  clean: true,
  target: "node18",
  // shebang is in source — tsup preserves it; do NOT add banner here
});
