/** Universal excludes applied to every project, regardless of language. */
export const UNIVERSAL_EXCLUDES: string[] = [
  // Version control
  ".git/**",
  ".svn/**",
  ".hg/**",

  // OS noise
  "**/.DS_Store",
  "**/Thumbs.db",
  "**/*.lnk",

  // Lock files (content is machine-generated, not useful for LLMs)
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Cargo.lock",
  "Podfile.lock",
  "composer.lock",
  "Gemfile.lock",
  "poetry.lock",
  "*.lock",

  // Build / type artifacts
  "**/*.tsbuildinfo",
  "**/*.pyc",
  "**/*.pyo",
  "**/*.class",
  "**/*.o",
  "**/*.a",
  "**/*.so",
  "**/*.dylib",
  "**/*.dll",
  "**/*.exe",
  "**/*.out",

  // Minified / generated assets
  "**/*.min.js",
  "**/*.min.css",

  // Source maps
  "**/*.map",

  // IDE metadata
  ".idea/**",
  ".vscode/**",
  "*.iml",
  ".project",
  ".classpath",
  "*.suo",
  "*.user",

  // Misc large blobs
  "**/*.jar",
  "**/*.war",
  "**/*.zip",
  "**/*.tar",
  "**/*.tar.gz",
  "**/*.tgz",
  "**/*.gz",
  "**/*.7z",
  "**/*.rar",
  "**/*.iso",
  "**/*.dmg",
  "**/*.pkg",
  "**/*.deb",
  "**/*.rpm",
  "**/*.whl",

  // Media (never useful as LLM input)
  "**/*.png",
  "**/*.jpg",
  "**/*.jpeg",
  "**/*.gif",
  "**/*.webp",
  "**/*.ico",
  "**/*.svg",
  "**/*.mp4",
  "**/*.mp3",
  "**/*.wav",
  "**/*.pdf",
  "**/*.woff",
  "**/*.woff2",
  "**/*.ttf",
  "**/*.eot",
];

/** Extensions considered text files - anything else is treated as binary and skipped. */
export const TEXT_EXTENSIONS = new Set([
  // Web / TypeScript
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  // Style
  "css", "scss", "sass", "less", "styl",
  // Templates / markup
  "html", "htm", "vue", "svelte", "astro", "njk", "ejs", "hbs", "liquid",
  // Config / data
  "json", "json5", "jsonc", "yaml", "yml", "toml", "ini", "conf", "config",
  "env", "properties",
  // Docs
  "md", "mdx", "markdown", "rst", "txt", "adoc",
  // Shell / scripts
  "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
  // Languages
  "py", "pyi", "rb", "go", "rs", "java", "kt", "kts", "scala", "groovy",
  "swift", "m", "mm", "h", "hpp", "c", "cpp", "cc", "cxx",
  "cs", "fs", "fsx", "vb",
  "php", "lua", "r", "R", "jl", "ex", "exs", "erl", "hrl",
  "hs", "lhs", "elm", "ml", "mli", "clj", "cljs", "cljc",
  "dart", "sol", "zig", "nim", "cr",
  // Database / query
  "sql", "graphql", "gql", "prisma",
  // Infra / config
  "tf", "tfvars", "hcl", "dockerfile", "Dockerfile",
  "proto", "thrift", "avsc",
  // Other text
  "xml", "svg", "csv", "tsv", "log",
  // Dotfiles (no extension)
  "gitignore", "gitattributes", "ctokignore", "editorconfig",
  "eslintrc", "prettierrc", "babelrc", "npmrc", "nvmrc",
]);
