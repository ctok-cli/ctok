// @ts-check
const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: false,
  minify: !watch,
  logLevel: "info",
  // @actions/core uses dynamic require for some optional bits — keep it external
  // to avoid bundling issues, but it IS a runtime dep so it will be in node_modules.
  // Actually we want to fully bundle for a self-contained action dist — no external.
};

if (watch) {
  esbuild.context(options).then((ctx) => {
    ctx.watch();
    console.log("Watching for changes…");
  });
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
