# Product Hunt launch

**Name:** ctok

**Tagline:** Lighthouse for Claude prompts - estimate tokens and cost before you send

**Description:**

ctok tells you exactly what your Claude prompt will cost - in tokens, dollars, and 5-hour quota - *before* you send it.

**What it does:**
- 📊 **Token estimator** - BPE-aware input/output ranges with confidence levels
- 💰 **Cost calculator** - list-price USD at your model, min/max range included
- 🤖 **Model recommender** - Haiku / Sonnet / Opus with written reasons and alternatives
- ✂️ **Prompt refiner** - 7-pass pipeline that trims filler and saves tokens automatically
- 📈 **Quota impact** - shows what % of your 5-hour window this prompt burns

**Five ways to use it:**
1. **CLI** - `npm install -g @ctok/cli` → `ctok check "your prompt"`
2. **Web playground** - paste or type at ctok.dev, get a shareable link
3. **MCP server** - connect to Claude Code, get token estimates as you write
4. **Desktop app** - drag a folder, see its token footprint instantly
5. **Browser extension** - live counter overlay on Claude.ai, ChatGPT, Cursor, and more

**Why I built it:** I kept burning my Claude Pro quota on poorly-formed prompts. Now I check first.

All analysis is local - no prompt text sent anywhere.

---

**First comment (post at launch):**

Hey PH! 👋

I'm the maker. Happy to answer anything.

The part I'm most proud of: the **prompt refiner**. It runs 7 passes (filler stripping, vague-verb replacement, deduplication, file-ref compression, output-format hints, negative-constraint collapsing, and structure scaffolding) and gives you a specificity score 0-100 across 7 dimensions. Most prompts improve 15-30% in token efficiency after a single refine.

The part that was hardest: calibrating the token estimator without access to Claude's actual tokenizer. I ran hundreds of prompts across code, prose, JSON, markdown, logs, and diffs, then built per-content-kind ratios. It's not perfect - but it shows ranges rather than fake precision.

What's next: real-time streaming token count as you type (for the web playground and extension), JetBrains plugin, and Slack / Discord bot integrations.

Open source: https://github.com/ctok-cli/ctok

---

**Makers:** <!-- TODO: replace with your Product Hunt username before launch -->

**Topics:** Developer Tools, Productivity, AI, CLI

**Gallery screenshots:**
1. CLI `ctok check` output (token estimate + recommendation table)
2. Web playground with token breakdown and refiner panel
3. Browser extension widget on claude.ai
4. Desktop app with drag-drop folder scan
