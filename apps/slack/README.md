# ctok Slack Bot

Estimate Claude token usage, cost, and quota impact from any Slack channel. Run the 7-pass prompt refiner inline.

## Commands

| Command | Description |
|---------|-------------|
| `/ctok check <prompt>` | Estimate tokens, cost, and get a model recommendation |
| `/ctok refine <prompt>` | Run the refiner - strips filler words, collapses vague verbs, shows tokens saved |
| `/ctok scan <path>` | Scan a server-side directory and report its token footprint |
| `/ctok help` | Show the help message |

You can also `@mention` the bot: `@ctok check <prompt>`.

### Options (append to any command)

| Flag | Example | Description |
|------|---------|-------------|
| `--model` | `--model haiku-4-5` | Override model for cost calculation |
| `--plan` | `--plan max5x` | Override plan for quota estimates |
| `--task` | `--task bug-fix` | Task type hint for model recommendation |

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `commands` - for `/ctok` slash command
   - `app_mentions:read` - to respond to @mentions
   - `chat:write` - to post messages
3. Under **Slash Commands**, create `/ctok` pointing at `https://your-host/slack/events`
4. Under **Event Subscriptions**, enable and subscribe to `app_mention`
5. Install the app to your workspace and copy the **Bot User OAuth Token**

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your tokens
```

For **Socket Mode** (no public URL needed, great for dev):
- Go to **Basic Information** → **App-Level Tokens** → generate a token with `connections:write`
- Set `SLACK_APP_TOKEN` in `.env`

### 3. Run

```bash
# Development (Socket Mode recommended)
pnpm dev

# Production (HTTP mode, needs public URL)
pnpm start

# Docker
docker build -t ctok-slack .
docker run -p 3000:3000 --env-file .env ctok-slack
```

## Privacy

All analysis (`@ctok/core`, `@ctok/refiner`, `@ctok/quota`) runs locally on the bot server. No prompt text is sent to ctok-cli.github.io/ctok or any external service. The `scan` command reads the **server's** filesystem, so only deploy where that's intentional.
