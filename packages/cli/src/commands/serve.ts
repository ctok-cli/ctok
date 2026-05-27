import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

export interface ServeOptions {
  port?: number;
}

export function runServe(opts: ServeOptions): void {
  const port = opts.port ?? 31337;

  // Locate the web package relative to the CLI package
  const webDir = path.resolve(__dirname, "../../../web");
  const webNext = path.join(webDir, ".next");
  const webOut = path.join(webDir, "out");

  // If this is running from a global npm install, the web package may not be
  // present. Fall back to opening ctok-cli.github.io/ctok in the default browser.
  if (!fs.existsSync(webDir)) {
    process.stdout.write(
      `  Web package not found locally. Open https://ctok-cli.github.io/ctok in your browser.\n`,
    );
    return;
  }

  // Prefer a static export (out/) which doesn't need a Node server, else fall
  // back to next start (dev-install scenario).
  if (fs.existsSync(webOut)) {
    // Serve the static export with a tiny http server
    try {
      execSync(`npx --yes serve -l ${port} .`, {
        cwd: webOut,
        stdio: "inherit",
        env: { ...process.env },
      });
    } catch {
      // serve exits when user ctrl-c's - that's fine
    }
    return;
  }

  // Fall back: next start (requires a dev checkout with a built Next.js app)
  if (fs.existsSync(webNext)) {
    try {
      execSync(`npx next start -p ${port}`, {
        cwd: webDir,
        stdio: "inherit",
        env: { ...process.env },
      });
    } catch {
      // next exits when user ctrl-c's - that's fine
    }
    return;
  }

  process.stderr.write(
    `  Neither ${webOut} nor ${webNext} found. Run \`pnpm --filter @ctok/web build\` first.\n`,
  );
  process.exit(1);
}
