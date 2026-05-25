export class CtokError extends Error {
  code: string;
  hint?: string;

  constructor(code: string, message: string, hint?: string) {
    super(message);
    this.name = "CtokError";
    this.code = code;
    this.hint = hint;
  }
}

/** Print a CtokError (or any Error) in a friendly format, then exit 1. */
export function fatal(err: unknown, debug = false): never {
  if (err instanceof CtokError) {
    process.stderr.write(`\n  error  ${err.message}\n`);
    if (err.hint) {
      process.stderr.write(`  hint   ${err.hint}\n`);
    }
    process.stderr.write(`  code   ${err.code}\n\n`);
    if (debug && err.stack) {
      process.stderr.write(err.stack + "\n");
    }
  } else if (err instanceof Error) {
    process.stderr.write(`\n  error  ${err.message}\n`);
    if (debug && err.stack) {
      process.stderr.write(err.stack + "\n");
    } else {
      process.stderr.write(`  hint   Re-run with --debug for a full stack trace.\n\n`);
    }
  } else {
    process.stderr.write(`\n  error  ${String(err)}\n\n`);
  }
  process.exit(1);
}
