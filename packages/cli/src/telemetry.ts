import https from "node:https";
import { createRequire } from "node:module";
import { readCtokConfig } from "@ctok/quota";

// Anonymous opt-in telemetry.
// Disabled by default. Enable with:  ctok config set telemetry true
//                        or env var: CTOK_TELEMETRY=1
// Disable with:                      ctok config set telemetry false
//                        or env var: CTOK_TELEMETRY=0
// Never sends prompt text, file names, or any PII.

const ENDPOINT = "https://plausible.io/api/event";
const DOMAIN = "ctok.dev";

function getVersion(): string {
  try {
    const req = createRequire(import.meta.url ?? __filename);
    return (req("../../package.json") as { version: string }).version;
  } catch {
    return "unknown";
  }
}

interface EventProps {
  [key: string]: string | number | boolean;
}

export function isOptedIn(): boolean {
  // Env var takes precedence: CTOK_TELEMETRY=1 enables, =0 disables
  const env = process.env["CTOK_TELEMETRY"];
  if (env === "1") return true;
  if (env === "0") return false;
  try {
    const val = readCtokConfig("telemetry");
    return val === true || val === "true";
  } catch {
    return false;
  }
}

/**
 * Fire-and-forget anonymous event. Swallows all errors - never throws.
 * Safe to call without await.
 */
export function trackEvent(name: string, props: EventProps = {}): void {
  if (!isOptedIn()) return;

  const version = getVersion();
  const payload = JSON.stringify({
    name,
    url: `app://ctok/${name}`,
    domain: DOMAIN,
    props: {
      version,
      platform: process.platform,
      node: process.version,
      ...props,
    },
  });

  try {
    const req = https.request(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "User-Agent": `ctok/${version}`,
      },
    });
    req.on("error", () => {});
    req.write(payload);
    req.end();
  } catch {
    // Never let telemetry errors propagate
  }
}
