// @ts-check
const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  // vscode is injected by the host — never bundle it
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: !watch,
  logLevel: "info",
};

if (watch) {
  esbuild.context(options).then((ctx) => {
    ctx.watch();
    console.log("Watching for changes…");
  });
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
