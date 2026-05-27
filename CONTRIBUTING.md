# Contributing to ctok

Thanks for your interest in contributing! This document covers how to set up the dev environment and the conventions the project uses.

## Prerequisites

- **Node.js ≥ 18**
- **pnpm ≥ 9** (`npm install -g pnpm`)
- **Rust stable** (only if building the desktop app)

## Setup

```sh
git clone https://github.com/ctok-cli/ctok.git
cd ctok
pnpm install
pnpm build        # builds all packages in dependency order
pnpm test         # runs all test suites
```

## Monorepo structure

```
packages/
  core/          @ctok/core      - estimation engine, recommender, reducer
  scanner/       @ctok/scanner   - project directory scanner
  refiner/       @ctok/refiner   - 7-pass prompt refiner
  quota/         @ctok/quota     - plan limit tables, quota impact calculator
  cli/           @ctok/cli       - Commander.js CLI
  mcp/           @ctok/mcp       - MCP server
  web/           @ctok/web       - Next.js playground (ctok-cli.github.io/ctok)
  desktop/       @ctok/desktop   - Tauri 2 wrapper
  browser-ext/   @ctok/browser-ext - Chrome MV3 extension
docs/            Astro Starlight docs site
```

## Development workflow

### Working on the CLI

```sh
pnpm --filter @ctok/cli dev    # tsup --watch
node packages/cli/dist/cli.js check "your prompt here"
```

### Working on the core engine

```sh
pnpm --filter @ctok/core dev
pnpm --filter @ctok/core test  # vitest
```

### Working on the refiner

```sh
pnpm --filter @ctok/refiner test --reporter=verbose
```

Corpus files live in `packages/refiner/test/corpus/`. Add new `.txt` files and corresponding test cases when adding or changing passes.

### Working on the web playground

```sh
pnpm --filter @ctok/web dev    # Next.js dev server at localhost:3000
```

## Testing

Each package has its own test suite:

```sh
pnpm --filter @ctok/core test
pnpm --filter @ctok/refiner test
pnpm --filter @ctok/scanner test
pnpm --filter @ctok/quota test
pnpm --filter @ctok/cli test
pnpm --filter @ctok/mcp test
```

Run everything from the root:

```sh
pnpm test
```

## Conventions

- **TypeScript strict mode** - no implicit any. `skipLibCheck: true` is fine.
- **No default exports** in library packages - named exports only.
- **Pure functions** in `@ctok/core`, `@ctok/refiner`, `@ctok/scanner` - no side effects, no I/O.
- **Vitest** for all unit tests.
- **tsup** for building: ESM + CJS for libraries, CJS-only for CLI and MCP.
- Test files in `test/` next to `src/`, named `*.test.ts`.
- Commit messages: imperative mood, present tense. `Add X`, not `Added X`.

## Pull requests

1. Fork and create a feature branch (`feat/my-feature` or `fix/issue-123`).
2. Make your changes with tests.
3. Run `pnpm test && pnpm typecheck` - must pass.
4. Open a PR against `main`. Fill in the PR template.

## Issues

Use the GitHub issue templates for bugs and feature requests. For questions, start a [Discussion](https://github.com/ctok-cli/ctok/discussions).

## License

By contributing, you agree your contributions will be licensed under the MIT License.
