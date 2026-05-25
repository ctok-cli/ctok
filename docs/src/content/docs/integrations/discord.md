---
title: Discord Bot
description: Add ctok to your Discord server — estimate tokens and refine prompts from any channel.
---

The ctok Discord bot exposes token estimation and prompt refinement as slash commands in any server.

## Commands

| Command | Description |
|---------|-------------|
| `/ctok check <prompt>` | Estimate tokens, cost, and model recommendation |
| `/ctok refine <prompt>` | Run the 7-pass refiner |
| `/ctok scan <directory>` | Scan a server-side directory |
| `/ctok help` | Show help |

`/ctok check` also accepts `model`, `plan`, and `task_type` options.

## Self-host setup

### 1. Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. **Bot** → **Add Bot** → copy the **Token**
3. **OAuth2 → URL Generator** → select scopes `bot`, `applications.commands`; permission: `Send Messages`, `Use Slash Commands`
4. Invite the bot to your server with the generated URL

### 2. Configure

```sh
cd apps/discord
cp .env.example .env
# Edit .env with DISCORD_TOKEN, DISCORD_CLIENT_ID
```

### 3. Register slash commands

```sh
# Guild-scoped (instant, for development)
DISCORD_GUILD_ID=your-guild-id pnpm deploy-commands

# Global (propagates in ~1 hour, for production)
pnpm deploy-commands
```

### 4. Run

```sh
# Development
pnpm dev

# Docker
docker build -t ctok-discord .
docker run --env-file .env ctok-discord
```

## Privacy

All analysis runs locally on the bot server. No prompt text is sent to ctok.dev or any external service.
