---
title: Browser Extension
description: Install the ctok browser extension for a live token overlay on Claude, ChatGPT, Cursor, DeepSeek, and Gemini.
---

The ctok browser extension injects a floating widget on supported AI chat interfaces, showing live token counts and cost estimates as you type.

## Install

- **Chrome / Edge**: [Chrome Web Store →](https://chrome.google.com/webstore/detail/ctok)
- **Firefox**: [Firefox Add-ons →](https://addons.mozilla.org/firefox/addon/ctok/)

## Supported sites

| Site | URL |
|------|-----|
| Claude | claude.ai |
| ChatGPT | chatgpt.com |
| Cursor | www.cursor.com |
| DeepSeek | chat.deepseek.com |
| Gemini | gemini.google.com |

## Widget features

The overlay appears in the bottom-right corner of the page as soon as you start typing.

**Live stats** - three-column grid shows:
- Input token estimate
- Estimated output tokens
- Approximate cost

**Model badge** - recommended model (Haiku / Sonnet / Opus) and effort level.

**Refine button** - runs the full 7-pass pipeline on your prompt and shows:
- Refined prompt text (copy to clipboard in one click)
- Token savings
- Specificity score before/after
- Per-pass breakdown (which passes fired and their token delta)

## Privacy

The extension runs entirely offline. It uses `@ctok/core` bundled inside the extension - no data is ever sent to ctok servers or any third party.

Required permissions:
- `host_permissions` for the 5 supported domains (to inject the content script)
- No `tabs`, `storage`, `cookies`, or `history` permissions

## Dismiss

Click the `×` in the widget header to hide it for the current page load.
