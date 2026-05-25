export type ProjectType =
  | "node"
  | "flutter"
  | "ios"
  | "android"
  | "rust"
  | "go"
  | "python"
  | "ruby"
  | "php"
  | "jvm"
  | "swift"
  | "dotnet"
  | "elixir"
  | "unknown";

export interface ScanOptions {
  /** Directory to scan. Defaults to process.cwd(). */
  root?: string;
  /** Skip files larger than this (bytes). Default: 1 MB. */
  maxFileBytes?: number;
  /** Additional glob patterns to exclude (beyond auto-detected). */
  exclude?: string[];
  /** Glob patterns to force-include even if they match an exclude rule. */
  include?: string[];
  /** Parse and apply .gitignore. Default: true. */
  respectGitignore?: boolean;
  /** Parse and apply .ctokignore. Default: true. */
  respectCtokignore?: boolean;
  /** How many files to list in topHeavyFiles. Default: 10. */
  topHeavyCount?: number;
}

export interface FileStat {
  path: string;    // relative to root
  bytes: number;
  tokens: number;
  ext: string;
}

export interface ProjectScan {
  root: string;
  projectType: ProjectType;
  totalFiles: number;
  totalBytes: number;
  estimatedTokens: number;
  byExtension: Record<string, { files: number; tokens: number }>;
  topHeavyFiles: Array<{ path: string; tokens: number }>;
  excluded: {
    files: number;
    bytes: number;
    reasons: Record<string, number>;
  };
}
