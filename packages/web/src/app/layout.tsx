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
  },
  twitter: {
    card: "summary",
    title: "ctok - Lighthouse for Claude prompts",
    description: "Estimate tokens, pick the right model, and refine prompts before you send to Claude.",
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
