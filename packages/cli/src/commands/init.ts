import * as fs from "node:fs";
import * as path from "node:path";
import { c } from "../output/format";

const CTOKIGNORE_TEMPLATE = `# .ctokignore - ctok will not count these paths toward token estimates
# Syntax is identical to .gitignore

# Build artifacts
dist/
build/
out/
.next/
.nuxt/
.output/

# Dependencies
node_modules/
vendor/
.pub-cache/

# Test fixtures and snapshots
**/__snapshots__/
**/test/fixtures/

# Generated files
coverage/
*.min.js
*.min.css

# Large data files
**/*.sql
**/*.csv
**/*.parquet
**/*.arrow
`;

const CLAUDE_MD_TEMPLATE = `# Project context for Claude

## Project overview
<!-- One paragraph describing what this project does and why it exists. -->

## Architecture
<!-- Key directories and what they contain. -->
- \`src/\` - source code
- \`tests/\` - test suite

## Development commands
\`\`\`
# Install deps
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build
npm run build
\`\`\`

## Coding conventions
<!-- Language, framework, style guide, naming conventions. -->
- Language: TypeScript / strict mode
- Tests: Vitest

## What NOT to do
<!-- Things Claude should avoid in this project. -->
- Do not modify lock files directly
- Do not add dependencies without checking with the team

## Key files
<!-- Most important entry points and config files. -->
- \`src/index.ts\` - main entry point

## Known issues / active work
<!-- What's in flight right now. -->
`;

export function runInit(opts: { force?: boolean }): void {
  const cwd = process.cwd();
  const ctokignorePath = path.join(cwd, ".ctokignore");
  const claudeMdPath = path.join(cwd, "CLAUDE.md");

  let wrote = 0;

  if (!fs.existsSync(ctokignorePath) || opts.force) {
    fs.writeFileSync(ctokignorePath, CTOKIGNORE_TEMPLATE, "utf8");
    process.stdout.write(c.ok(`✓ Created .ctokignore\n`));
    wrote++;
  } else {
    process.stdout.write(c.dim(`  .ctokignore already exists (use --force to overwrite)\n`));
  }

  if (!fs.existsSync(claudeMdPath) || opts.force) {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD_TEMPLATE, "utf8");
    process.stdout.write(c.ok(`✓ Created CLAUDE.md\n`));
    wrote++;
  } else {
    process.stdout.write(c.dim(`  CLAUDE.md already exists (use --force to overwrite)\n`));
  }

  if (wrote > 0) {
    process.stdout.write(
      `\n  Edit these files to improve your ctok experience and Claude context quality.\n`,
    );
  }
}
