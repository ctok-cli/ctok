# ctok — Zed Extension

Estimate Claude token counts, analyze costs, and refine prompts directly in [Zed](https://zed.dev)'s AI assistant panel.

All heavy lifting is delegated to the `ctok` CLI; this extension is a thin Rust/WASM wrapper that runs the binary and formats results as Markdown.

## Requirements

- Zed 0.150+
- `ctok` CLI installed: `npm i -g @ctok/cli`

## Installation

### From Zed Extension Registry

1. Open **Zed → Extensions** (`Cmd+Shift+X`)
2. Search for **ctok**
3. Click **Install**

### From Source

```bash
cd apps/zed
cargo build --release --target wasm32-wasip1
# Then load the extension directory in Zed's dev extension path
```

## Usage

Open the AI assistant panel (`Cmd+?`) and type a slash command:

| Command | Description |
|---|---|
| `/ctok-check <text>` | Estimate tokens and cost for the given text |
| `/ctok-refine <text>` | Refine a prompt — shows the improved version + savings |
| `/ctok-scan` | Scan the current project directory |

### Examples

Estimate tokens for a prompt:
```
/ctok-check Refactor the authentication middleware to use Postgres sessions
```

Refine a vague prompt:
```
/ctok-refine Please help me handle the auth thing somehow in a better way
```

Scan the current project:
```
/ctok-scan
```

## Development

Build the WASM target:

```bash
# Install the wasm32-wasip1 target
rustup target add wasm32-wasip1

# Build release
cargo build --release --target wasm32-wasip1
```

Check types without WASM compilation:

```bash
cargo check
```

## License

MIT
