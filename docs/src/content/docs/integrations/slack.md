---
title: Slack Bot
description: Add ctok to your Slack workspace — estimate tokens and refine prompts from any channel.
---

The ctok Slack bot lets your whole team estimate Claude token usage directly from Slack.

## Commands

| Command | Description |
|---------|-------------|
| `/ctok check <prompt>` | Estimate tokens, cost, and get a model recommendation |
| `/ctok refine <prompt>` | Run the refiner — shows tokens saved |
| `/ctok scan <path>` | Scan a server-side directory |
| `/ctok help` | Show help |

You can also `@mention` the bot: `@ctok check <prompt>`.

### Options

Append to any command:

| Flag | Example | Description |
|------|---------|-------------|
| `--model` | `--model haiku-4-5` | Override model |
| `--plan` | `--plan max5x` | Override plan |
| `--task` | `--task bug-fix` | Task type hint |

## Self-host setup

### 1. Create a Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. **OAuth & Permissions** — add scopes: `commands`, `app_mentions:read`, `chat:write`
3. **Slash Commands** — create `/ctok` pointing at `https://your-host/slack/events`
4. **Event Subscriptions** — enable and subscribe to `app_mention`
5. Install the app and copy the **Bot User OAuth Token**

### 2. Configure

```sh
cd apps/slack
cp .env.example .env
# Edit .env with your SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET
```

For **Socket Mode** (no public URL):
- Generate an App-Level Token with `connections:write`
- Set `SLACK_APP_TOKEN` in `.env`

### 3. Run

```sh
# Development
pnpm dev

# Docker
docker build -t ctok-slack .
docker run -p 3000:3000 --env-file .env ctok-slack
```

## Privacy

All analysis runs locally on the bot server. No prompt text is sent to ctok.dev or any external service.
