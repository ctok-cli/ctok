// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Default to GitHub Pages (https://ctok-cli.github.io/ctok). When the docs
// later move to a Vercel-hosted root or to docs.ctok.dev, override via env:
//   SITE=https://ctok.dev BASE=/docs pnpm --filter @ctok/docs build
const site = process.env.SITE ?? "https://ctok-cli.github.io";
const base = process.env.BASE ?? "/ctok";

export default defineConfig({
  site,
  base,
  integrations: [
    starlight({
      title: "ctok",
      tagline: "Lighthouse for Claude prompts",
      description:
        "Estimate Claude API token usage, get the optimal model and effort recommendation, and refine prompts to reduce cost.",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: false,
      },
      social: {
        github: "https://github.com/ctok-cli/ctok",
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Getting started",
          items: [
            { label: "Introduction",  slug: "index" },
            { label: "Installation",  slug: "installation" },
          ],
        },
        {
          label: "CLI",
          items: [
            { label: "Commands",      slug: "cli/commands" },
            { label: "Configuration", slug: "cli/config" },
          ],
        },
        {
          label: "Web playground",
          items: [
            { label: "Using the playground", slug: "web/playground" },
          ],
        },
        {
          label: "MCP server",
          items: [
            { label: "Setup & tools", slug: "mcp/setup" },
          ],
        },
        {
          label: "Desktop app",
          items: [
            { label: "Install", slug: "desktop/install" },
          ],
        },
        {
          label: "Browser extension",
          items: [
            { label: "Install", slug: "ext/install" },
          ],
        },
        {
          label: "IDE extensions",
          items: [
            { label: "VS Code",    slug: "ide/vscode" },
            { label: "JetBrains", slug: "ide/jetbrains" },
            { label: "Raycast",   slug: "ide/raycast" },
            { label: "Xcode",     slug: "ide/xcode" },
          ],
        },
        {
          label: "Integrations",
          items: [
            { label: "GitHub Action", slug: "integrations/github-action" },
            { label: "Slack bot",     slug: "integrations/slack" },
            { label: "Discord bot",   slug: "integrations/discord" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Token estimation",      slug: "reference/estimation" },
            { label: "Model recommendations", slug: "reference/models" },
            { label: "Prompt refiner",        slug: "reference/refiner" },
          ],
        },
      ],
      head: [
        {
          tag: "link",
          attrs: { rel: "icon", type: "image/svg+xml", href: `${base}/favicon.svg` },
        },
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", href: `${base}/favicon.svg` },
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://ctok.dev/og.png" },
        },
      ],
    }),
  ],
});
