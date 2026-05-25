# @ctok/cli

> Command-line tool to estimate Claude tokens, recommend models, and refine prompts before you send them.

```sh
ctok check "Refactor the auth module to use JWT"
ctok refine --diff "please can you kindly help me handle the auth thing"
ctok scan ./my-project
```

## Install

```sh
npm install -g @ctok/cli
```

Other install paths (Homebrew, Scoop, winget, curl one-liner): see [USAGE.md](https://github.com/ctok-cli/ctok/blob/main/USAGE.md#install-the-cli).

## Commands

| Command | Description |
|---|---|
| `ctok check [prompt]` | Estimate tokens, cost, and quota impact |
| `ctok refine [prompt]` | Run the 7-pass prompt refiner |
| `ctok refine --diff` | Side-by-side coloured diff plus specificity score |
| `ctok scan [dir]` | Analyse a project directory |
| `ctok model [prompt]` | Recommend model and effort level |
| `ctok serve` | Launch the web playground locally |
| `ctok history` | Show recent prompt history |
| `ctok config` | Get or set configuration values |
| `ctok init` | Write .ctokignore for the current project |
| `ctok doctor` | Check environment and config |

Run `ctok <command> --help` for full options. Use `--json` for machine-readable output.

Part of **ctok** - Lighthouse for Claude prompts.

## Documentation

- Repo: https://github.com/ctok-cli/ctok
- Full usage guide: https://github.com/ctok-cli/ctok/blob/main/USAGE.md

## License

MIT - see [LICENSE](https://github.com/ctok-cli/ctok/blob/main/LICENSE).
