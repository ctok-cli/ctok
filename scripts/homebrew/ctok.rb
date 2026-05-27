# Homebrew formula for ctok
# Maintained at: https://github.com/ctok-cli/homebrew-ctok
#
# To use:
#   brew tap ctok-cli/tap
#   brew install ctok
#
# This file is auto-updated by the release workflow.
# SHA256 values below are placeholders - the release workflow patches them.

class Ctok < Formula
  desc "Lighthouse for Claude prompts - estimate tokens, recommend models, refine prompts"
  homepage "https://ctok.dev"
  version "0.1.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/ctok-cli/ctok/releases/download/v#{version}/ctok-macos-arm64"
      sha256 "PLACEHOLDER_ARM64_SHA256"

      def install
        bin.install "ctok-macos-arm64" => "ctok"
      end
    else
      url "https://github.com/ctok-cli/ctok/releases/download/v#{version}/ctok-macos-x64"
      sha256 "PLACEHOLDER_X64_SHA256"

      def install
        bin.install "ctok-macos-x64" => "ctok"
      end
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/ctok-cli/ctok/releases/download/v#{version}/ctok-linux-arm64"
      sha256 "PLACEHOLDER_LINUX_ARM64_SHA256"

      def install
        bin.install "ctok-linux-arm64" => "ctok"
      end
    else
      url "https://github.com/ctok-cli/ctok/releases/download/v#{version}/ctok-linux-x64"
      sha256 "PLACEHOLDER_LINUX_X64_SHA256"

      def install
        bin.install "ctok-linux-x64" => "ctok"
      end
    end
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/ctok --version")
  end
end
