import { defineConfig } from "tsup";

// tsup IIFE format defaults to *.global.js - outExtension overrides to plain *.js
// so manifest.json references (content.js, background.js, popup.js) match.

const iife = {
  format: ["iife" as const],
  outExtension: () => ({ js: ".js" }),
  target: "chrome89" as const,
};

export default defineConfig([
  // content script - bundles @ctok/core, @ctok/refiner, preact + widget
  {
    ...iife,
    entry: { content: "src/content.ts" },
    outDir: "dist",
    clean: true,
    noExternal: ["@ctok/core", "@ctok/refiner", "preact"],
    esbuildOptions(opts) {
      opts.jsxFactory = "h";
      opts.jsxFragment = "Fragment";
    },
  },
  // background service worker
  {
    ...iife,
    entry: { background: "src/background.ts" },
    outDir: "dist",
  },
  // popup page script
  {
    ...iife,
    entry: { popup: "src/popup.ts" },
    outDir: "dist",
  },
]);
