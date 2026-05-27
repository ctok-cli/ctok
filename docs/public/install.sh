#!/usr/bin/env sh
# ctok installer - https://ctok.dev/install.sh
# Usage: curl -fsSL https://ctok.dev/install.sh | sh
set -e

REPO="ctok-cli/ctok"
BIN_DIR="${CTOK_BIN:-$HOME/.ctok/bin}"
VERSION="${CTOK_VERSION:-latest}"

# ── Detect OS / arch ────────────────────────────────────────────────────────

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)  OS_NAME="linux" ;;
  Darwin*) OS_NAME="macos" ;;
  *)
    echo "Unsupported OS: $OS" >&2
    echo "Install via npm instead: npm install -g @ctok/cli" >&2
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64)   ARCH_NAME="x64"   ;;
  aarch64|arm64)  ARCH_NAME="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    echo "Install via npm instead: npm install -g @ctok/cli" >&2
    exit 1
    ;;
esac

BINARY="ctok-${OS_NAME}-${ARCH_NAME}"

# ── Resolve version ──────────────────────────────────────────────────────────

if [ "$VERSION" = "latest" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"v\([^"]*\)".*/\1/')"
  if [ -z "$VERSION" ]; then
    echo "Failed to resolve latest version. Set CTOK_VERSION explicitly." >&2
    exit 1
  fi
fi

echo "Installing ctok v${VERSION} (${OS_NAME}/${ARCH_NAME})..."

# ── Download ─────────────────────────────────────────────────────────────────

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY}"
TMP="$(mktemp)"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL" -o "$TMP"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$TMP" "$DOWNLOAD_URL"
else
  echo "Neither curl nor wget found. Install one and retry." >&2
  exit 1
fi

# ── Install ──────────────────────────────────────────────────────────────────

mkdir -p "$BIN_DIR"
cp "$TMP" "$BIN_DIR/ctok"
chmod +x "$BIN_DIR/ctok"
rm -f "$TMP"

# macOS: clear quarantine flag set by Gatekeeper on downloaded files
if [ "$OS_NAME" = "macos" ]; then
  xattr -c "$BIN_DIR/ctok" 2>/dev/null || true
fi

# ── PATH hint ────────────────────────────────────────────────────────────────

echo ""
echo "ctok v${VERSION} installed to ${BIN_DIR}/ctok"
echo ""

# Check if bin dir is already on PATH
case ":$PATH:" in
  *":${BIN_DIR}:"*)
    echo "  Run: ctok --version"
    ;;
  *)
    echo "  Add to PATH (add to your shell profile):"
    echo "    export PATH=\"\$PATH:${BIN_DIR}\""
    echo ""
    echo "  Or run directly: ${BIN_DIR}/ctok --version"
    ;;
esac
