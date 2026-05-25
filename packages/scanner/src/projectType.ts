import fs from "node:fs";
import path from "node:path";
import type { ProjectType } from "./types";

interface Detection {
  type: ProjectType;
  /** Glob patterns to auto-exclude for this project type (relative to root). */
  excludes: string[];
}

const DETECTORS: Array<{
  test: (root: string) => boolean;
  result: Detection;
}> = [
  // Flutter — check before Node because Flutter projects can also have package.json
  {
    test: (r) => exists(r, "pubspec.yaml"),
    result: {
      type: "flutter",
      excludes: ["build/**", ".dart_tool/**", ".flutter-plugins", ".flutter-plugins-dependencies", ".pub-cache/**"],
    },
  },
  // iOS (Podfile or *.xcodeproj directory)
  {
    test: (r) =>
      exists(r, "Podfile") ||
      fs.readdirSync(r).some((f) => f.endsWith(".xcodeproj")),
    result: {
      type: "ios",
      excludes: ["Pods/**", "DerivedData/**", ".build/**", "xcuserdata/**", "**/*.xcworkspace/**"],
    },
  },
  // Swift Package (no Podfile, but has Package.swift)
  {
    test: (r) => exists(r, "Package.swift") && !exists(r, "Podfile"),
    result: {
      type: "swift",
      excludes: [".build/**", ".swiftpm/**"],
    },
  },
  // Android — check before JVM
  {
    test: (r) =>
      existsGlob(r, ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"]) &&
      (exists(r, "app") || existsGlob(r, ["gradlew", "gradlew.bat"])),
    result: {
      type: "android",
      excludes: ["build/**", ".gradle/**", "app/build/**", "local.properties"],
    },
  },
  // JVM (Maven / bare Gradle without Android markers)
  {
    test: (r) =>
      exists(r, "pom.xml") ||
      existsGlob(r, ["build.gradle", "build.gradle.kts"]),
    result: {
      type: "jvm",
      excludes: ["target/**", ".gradle/**", "out/**", "build/**"],
    },
  },
  // .NET
  {
    test: (r) =>
      fs.readdirSync(r).some((f) => f.endsWith(".csproj") || f.endsWith(".sln")),
    result: {
      type: "dotnet",
      excludes: ["bin/**", "obj/**"],
    },
  },
  // Rust
  {
    test: (r) => exists(r, "Cargo.toml"),
    result: {
      type: "rust",
      excludes: ["target/**"],
    },
  },
  // Go
  {
    test: (r) => exists(r, "go.mod"),
    result: {
      type: "go",
      // vendor only excluded if it actually exists
      excludes: ["vendor/**"],
    },
  },
  // Python
  {
    test: (r) =>
      exists(r, "requirements.txt") ||
      exists(r, "pyproject.toml") ||
      exists(r, "setup.py") ||
      exists(r, "setup.cfg") ||
      exists(r, "Pipfile"),
    result: {
      type: "python",
      excludes: [
        "__pycache__/**",
        "venv/**",
        ".venv/**",
        "env/**",
        "**/*.egg-info/**",
        ".pytest_cache/**",
        ".mypy_cache/**",
        ".ruff_cache/**",
        "dist/**",
        "build/**",
      ],
    },
  },
  // Ruby
  {
    test: (r) => exists(r, "Gemfile"),
    result: {
      type: "ruby",
      excludes: ["vendor/**", ".bundle/**"],
    },
  },
  // PHP
  {
    test: (r) => exists(r, "composer.json"),
    result: {
      type: "php",
      excludes: ["vendor/**"],
    },
  },
  // Elixir
  {
    test: (r) => exists(r, "mix.exs"),
    result: {
      type: "elixir",
      excludes: ["_build/**", "deps/**"],
    },
  },
  // Node — last so language-specific projects aren't mis-detected
  {
    test: (r) => exists(r, "package.json"),
    result: {
      type: "node",
      excludes: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        ".turbo/**",
        "out/**",
        "coverage/**",
        ".cache/**",
        ".vercel/**",
        ".output/**",
        "storybook-static/**",
      ],
    },
  },
];

export function detectProjectType(root: string): Detection {
  for (const d of DETECTORS) {
    try {
      if (d.test(root)) return d.result;
    } catch {
      // readdirSync can fail for permission errors — skip
    }
  }
  return { type: "unknown", excludes: [] };
}

function exists(root: string, name: string): boolean {
  return fs.existsSync(path.join(root, name));
}

function existsGlob(root: string, names: string[]): boolean {
  return names.some((n) => exists(root, n));
}
