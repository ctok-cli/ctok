# Twitter / X launch thread

---

**Tweet 1 (main):**

Launching ctok — a Lighthouse for Claude prompts 🔦

Before you send: estimate tokens, cost, quota impact, and get model recommendations.

npm install -g @ctok/cli

🧵 [thread]

---

**Tweet 2:**

The problem: Claude's 5-hour quota disappears fast when you're sending bloated prompts.

ctok tells you beforehand:
• how many tokens
• what % of your 5h window
• whether Haiku would do fine instead of Sonnet

---

**Tweet 3:**

The 7-pass prompt refiner is my favourite part.

"please can you help me to write a function that sorts an array"
→ "Write a sort function"

It strips filler, replaces vague verbs, deduplicates, compresses file references, and adds structure.

Most prompts save 15–30% of tokens.

---

**Tweet 4:**

Five surfaces, one engine:

CLI → npm install -g @ctok/cli
Web → ctok.dev (shareable URL hash links)
MCP → npx -y @ctok/mcp (works with Claude Code)
Desktop → Tauri 2 app with drag-drop folder scan
Extension → Live counter on Claude.ai, ChatGPT, Cursor, DeepSeek, Gemini

---

**Tweet 5:**

The token estimator doesn't pretend to be precise.

Claude's tokenizer isn't public. I built a content-kind detector (code vs prose vs JSON vs minified vs diff) and calibrated BPE ratios for each.

It shows ranges + confidence levels. Honest uncertainty > fake precision.

---

**Tweet 6:**

All local. No prompt text sent anywhere.
Telemetry: opt-in, off by default, anonymous event names only.
License: MIT.

Source: github.com/ctok-cli/ctok

Try it: ctok.dev

---

**Standalone tweet (for non-thread days):**

Built ctok — estimate Claude token cost + quota impact before you send.

`npm install -g @ctok/cli`
`ctok check "your prompt"`

Also: web playground (ctok.dev), MCP server, desktop app, Chrome extension.

Open source, no telemetry by default. github.com/ctok-cli/ctok
