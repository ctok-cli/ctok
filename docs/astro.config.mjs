// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Default to GitHub Pages (https://ctok-cli.github.io/ctok). When the docs
// later move to a custom domain like docs.example.com, override via env:
//   SITE=https://docs.example.com BASE=/ pnpm --filter @ctok/docs build
const site = process.env.SITE ?? "https://ctok-cli.github.io";
const base = process.env.BASE ?? "/ctok";

export default defineConfig({
  site,
  base,
  integrations: [
    starlight({
      title: "ctok",
      tagline: "Claude token estimator, cost calculator, and prompt refiner",
      description:
        "Free Claude token estimator and prompt refiner. Calculate Claude API cost, count tokens for Haiku, Sonnet, and Opus, pick the right model, and tighten prompts before you send. CLI, MCP server, web playground, VS Code, JetBrains, Slack, Discord.",
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
          attrs: {
            name: "keywords",
            content:
              "claude token estimator, claude api cost calculator, claude prompt cost, claude token counter, anthropic token calculator, claude api pricing, claude prompt refiner, claude code cli, mcp server, model context protocol, claude haiku cost, claude sonnet cost, claude opus cost, claude max plan quota, prompt engineering tool, llm cost calculator",
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://ctok-cli.github.io/ctok/og.png" },
        },
        {
          tag: "meta",
          attrs: { property: "og:type", content: "website" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:creator", content: "@ctok_cli" },
        },
        {
          tag: "meta",
          attrs: { name: "author", content: "ctok-cli" },
        },
        {
          tag: "link",
          attrs: { rel: "canonical", href: `${site}${base}/` },
        },
        // JSON-LD: tell Google "this is a free developer SoftwareApplication"
        // so the result can render with a rich-card treatment and rank for
        // intent queries like "claude token estimator".
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ctok",
            alternateName: "Claude Token Checker",
            description:
              "Estimate Claude API token usage and cost, recommend the right model (Haiku, Sonnet, Opus) and effort level, and refine prompts to reduce cost. Free and open source.",
            applicationCategory: "DeveloperApplication",
            applicationSubCategory: "CommandLineApplication",
            operatingSystem: "Windows, macOS, Linux",
            url: `${site}${base}/`,
            downloadUrl: "https://www.npmjs.com/package/@ctok/cli",
            softwareVersion: "0.1.0",
            license: "https://opensource.org/licenses/MIT",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            author: {
              "@type": "Organization",
              name: "ctok-cli",
              url: "https://github.com/ctok-cli",
            },
            keywords:
              "claude, anthropic, tokens, cost calculator, prompt engineering, llm, cli, mcp, model context protocol, vscode extension, jetbrains plugin",
          }),
        },
      ],
    }),
  ],
});
