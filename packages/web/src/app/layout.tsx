import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ctok - Lighthouse for Claude prompts",
  description:
    "Estimate Claude API token usage, get the optimal model and effort recommendation, and refine prompts to reduce cost - right in your browser.",
  openGraph: {
    title: "ctok - Lighthouse for Claude prompts",
    description: "Estimate tokens, pick the right model, and refine prompts before you send to Claude.",
    url: "https://ctok-cli.github.io/ctok",
    siteName: "ctok",
    type: "website",
    images: [{ url: "https://ctok-cli.github.io/ctok/og.png", width: 1280, height: 640, alt: "ctok - Lighthouse for Claude prompts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ctok - Lighthouse for Claude prompts",
    description: "Estimate tokens, pick the right model, and refine prompts before you send to Claude.",
    images: ["https://ctok-cli.github.io/ctok/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
