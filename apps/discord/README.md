# ctok Discord Bot

Estimate Claude token usage, cost, and quota impact from any Discord server. Run the 7-pass prompt refiner inline.

## Commands

| Command | Description |
|---------|-------------|
| `/ctok check <prompt>` | Estimate tokens, cost, and get a model recommendation |
| `/ctok refine <prompt>` | Run the refiner - strips filler words, collapses vague verbs, shows tokens saved |
| `/ctok scan <directory>` | Scan a server-side directory and report its token footprint |
| `/ctok help` | Show the help message |

### Options (on `/ctok check`)

| Option | Example | Description |
|--------|---------|-------------|
| `model` | `haiku-4-5` | Override model for cost calculation |
| `plan` | `max5x` | Override plan for quota estimates |
| `task_type` | `bug-fix` | Task type hint for model recommendation |

## Setup

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. Under **Bot**, click **Add Bot** → copy the **Token**
3. Under **OAuth2 → URL Generator**, select scopes: `bot`, `applications.commands`
4. Select bot permissions: `Send Messages`, `Use Slash Commands`
5. Copy the generated URL and invite the bot to your server

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your tokens
```

### 3. Deploy slash commands

Commands must be registered before users can see them:

```bash
# Guild-scoped (instant, recommended for development)
DISCORD_GUILD_ID=your-guild-id pnpm deploy-commands

# Global (propagates in ~1 hour, for production)
pnpm deploy-commands
```

### 4. Run

```bash
# Development
pnpm dev

# Production (build first)
pnpm build && pnpm start

# Docker
docker build -t ctok-discord .
docker run --env-file .env ctok-discord
```

## Privacy

All analysis (`@ctok/core`, `@ctok/refiner`, `@ctok/quota`) runs locally on the bot server. No prompt text is sent to ctok.dev or any external service. The `scan` command reads the **server's** filesystem, so only deploy where that's intentional.
