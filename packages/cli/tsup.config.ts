import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["cjs"],
  dts: false,
  clean: true,
  target: "node18",
});
