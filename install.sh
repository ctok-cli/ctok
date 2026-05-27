#!/usr/bin/env sh
# install.sh - ctok one-liner installer for Linux and macOS
#
# Usage:
#   curl -fsSL https://ctok.dev/install.sh | sh
#   curl -fsSL https://ctok.dev/install.sh | sh -s -- --version 0.2.0
#   curl -fsSL https://ctok.dev/install.sh | sh -s -- --dir /usr/local/bin
#
# Environment overrides:
#   CTOK_VERSION   - install a specific version instead of latest
#   CTOK_DIR       - install directory (default: ~/.ctok/bin)
#   CTOK_NO_PATH   - set to "1" to skip shell profile PATH update

set -eu

REPO="ctok-cli/ctok"
INSTALL_DIR="${CTOK_DIR:-$HOME/.ctok/bin}"
VERSION="${CTOK_VERSION:-}"
NO_PATH="${CTOK_NO_PATH:-0}"

# ── Parse flags ──────────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --version)  VERSION="$2"; shift 2 ;;
    --dir)      INSTALL_DIR="$2"; shift 2 ;;
    --no-path)  NO_PATH=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ── Detect OS and architecture ───────────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64)  BINARY="ctok-macos-arm64" ;;
      x86_64) BINARY="ctok-macos-x64"   ;;
      *)      echo "Unsupported macOS arch: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64)         BINARY="ctok-linux-x64"   ;;
      aarch64|arm64)  BINARY="ctok-linux-arm64"  ;;
      *)              echo "Unsupported Linux arch: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS. On Windows, run install.ps1 instead." >&2
    exit 1
    ;;
esac

# ── Resolve version ──────────────────────────────────────────────────────────
if [ -z "$VERSION" ]; then
  echo "Fetching latest ctok release..."
  if command -v curl >/dev/null 2>&1; then
    VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
      | grep '"tag_name"' | sed 's/.*"tag_name": *"v\([^"]*\)".*/\1/')"
  elif command -v wget >/dev/null 2>&1; then
    VERSION="$(wget -qO- "https://api.github.com/repos/$REPO/releases/latest" \
      | grep '"tag_name"' | sed 's/.*"tag_name": *"v\([^"]*\)".*/\1/')"
  else
    echo "curl or wget is required" >&2
    exit 1
  fi
fi

if [ -z "$VERSION" ]; then
  echo "Could not determine latest version. Set CTOK_VERSION and retry." >&2
  exit 1
fi

BASE_URL="https://github.com/$REPO/releases/download/v${VERSION}"
BINARY_URL="$BASE_URL/$BINARY"
CHECKSUM_URL="$BASE_URL/SHA256SUMS.txt"

# ── Download ─────────────────────────────────────────────────────────────────
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading ctok v${VERSION} (${BINARY})..."
if command -v curl >/dev/null 2>&1; then
  curl -fsSL --progress-bar "$BINARY_URL"   -o "$TMP/ctok"
  curl -fsSL                "$CHECKSUM_URL" -o "$TMP/SHA256SUMS.txt" 2>/dev/null || true
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$TMP/ctok"            "$BINARY_URL"
  wget -qO "$TMP/SHA256SUMS.txt"  "$CHECKSUM_URL" 2>/dev/null || true
fi

# ── Verify checksum (best-effort) ────────────────────────────────────────────
if [ -f "$TMP/SHA256SUMS.txt" ]; then
  EXPECTED="$(grep "$BINARY" "$TMP/SHA256SUMS.txt" | awk '{print $1}')"
  if [ -n "$EXPECTED" ]; then
    if command -v sha256sum >/dev/null 2>&1; then
      ACTUAL="$(sha256sum "$TMP/ctok" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
      ACTUAL="$(shasum -a 256 "$TMP/ctok" | awk '{print $1}')"
    else
      ACTUAL=""
    fi
    if [ -n "$ACTUAL" ] && [ "$ACTUAL" != "$EXPECTED" ]; then
      echo "Checksum mismatch!" >&2
      echo "  Expected: $EXPECTED" >&2
      echo "  Got:      $ACTUAL"  >&2
      exit 1
    fi
    [ -n "$ACTUAL" ] && echo "Checksum verified."
  fi
fi

# ── Install ───────────────────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
chmod +x "$TMP/ctok"
mv "$TMP/ctok" "$INSTALL_DIR/ctok"

echo "Installed ctok v${VERSION} → ${INSTALL_DIR}/ctok"

# ── Add to PATH ───────────────────────────────────────────────────────────────
if [ "$NO_PATH" = "0" ] && ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
  PROFILE=""
  if [ -n "${ZSH_VERSION:-}" ] || [ "$(basename "${SHELL:-}")" = "zsh" ]; then
    PROFILE="$HOME/.zshrc"
  elif [ -n "${BASH_VERSION:-}" ] || [ "$(basename "${SHELL:-}")" = "bash" ]; then
    PROFILE="${BASH_ENV:-${HOME}/.bashrc}"
    [ -f "$HOME/.bash_profile" ] && PROFILE="$HOME/.bash_profile"
  elif [ -f "$HOME/.profile" ]; then
    PROFILE="$HOME/.profile"
  fi

  if [ -n "$PROFILE" ]; then
    LINE="export PATH=\"\$PATH:$INSTALL_DIR\""
    if ! grep -qF "$INSTALL_DIR" "$PROFILE" 2>/dev/null; then
      printf '\n# ctok\n%s\n' "$LINE" >> "$PROFILE"
      echo "Added $INSTALL_DIR to PATH in $PROFILE"
    fi
    echo "Restart your shell or run:  export PATH=\"\$PATH:$INSTALL_DIR\""
  else
    echo "Add $INSTALL_DIR to your PATH manually."
  fi
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "Run: ctok --version"
echo "     ctok doctor"
echo "     ctok help"
