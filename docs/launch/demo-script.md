# 60-second demo video script

**Target length:** 58–62 seconds
**Format:** screen recording with voice-over. Terminal + browser side by side.
**Audience:** Claude Pro/Max users who are frustrated by quota burn.

---

## Script

**[0:00–0:05] — Hook (terminal visible, cursor blinking)**

*Voice:* "How much of your Claude quota does this prompt actually burn?"

*Screen:* Show a long prompt in a text editor — something like a big code refactor request.

---

**[0:05–0:15] — Install + first check**

*Voice:* "ctok tells you before you send. Install it in seconds."

*Screen:*
```
npm install -g @ctok/cli
ctok check "Refactor the auth module to use JWT with refresh token rotation"
```

Output appears: token count, cost table, model recommendation.

*Voice:* "18 input tokens, ~1,400 output. $0.004. Sonnet is the right model."

---

**[0:15–0:25] — Quota impact**

*Voice:* "And here's the part that actually matters if you're on Pro."

*Screen:* Highlight the quota section of the output:
```
5h window   2.3% used by this prompt
Remaining   ~43 similar prompts
```

*Voice:* "43 similar prompts left in your 5-hour window. Now you know."

---

**[0:25–0:38] — Prompt refiner**

*Voice:* "Got a bloated prompt? Run it through the refiner."

*Screen:*
```
ctok refine "please can you help me write a function that does sorting"
```

Refiner output shows passes applied, specificity score, and refined prompt.

*Voice:* "Seven passes: strips filler, replaces vague verbs, adds structure. Saved 34%."

---

**[0:38–0:48] — Web + MCP**

*Voice:* "Prefer a UI? ctok.dev. Paste your prompt, get a shareable link."

*Screen:* Switch to browser showing ctok.dev with the same prompt loaded.

*Voice:* "Or connect the MCP server to Claude Code — estimate tokens right in your editor."

*Screen:* Quick flash of Claude Code with ctok MCP tool results.

---

**[0:48–0:58] — Wrap**

*Voice:* "CLI, web playground, MCP server, desktop app, Chrome extension. All local, no telemetry by default."

*Screen:* Split showing CLI on left, browser extension widget on right (floating on claude.ai).

*Voice:* "ctok. Open source. npm install -g @ctok/cli"

*Screen:* End card with ctok.dev URL and GitHub link.

---

## Recording checklist

- [ ] Terminal: large font, dark theme, 80-col window
- [ ] Record at 1920×1080, export at 1080p
- [ ] Trim silence > 0.3s between commands
- [ ] Add captions (auto-generate + review)
- [ ] Keep voice-over calm and matter-of-fact — not hype
- [ ] Final length: confirm 58–62 seconds

## Thumbnail

- Dark background
- `ctok check "..."` command visible
- Token/cost table partially visible
- Tagline: "Know your Claude cost before you send"
