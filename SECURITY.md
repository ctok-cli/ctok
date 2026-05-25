# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please **do not** file a public GitHub issue for security vulnerabilities.

Report vulnerabilities by emailing **security@ctok.dev** with:
- Description of the issue
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You will receive an acknowledgement within 48 hours. We aim to release a fix within 14 days for high-severity issues.

## Scope

In scope:
- `@ctok/cli` - command injection, path traversal, credential exposure
- `@ctok/mcp` - prompt injection via tool arguments
- `@ctok/web` - XSS, CSP bypass
- `@ctok/browser-ext` - content script injection, cross-origin data leakage
- `@ctok/desktop` - Tauri IPC abuse, privilege escalation

Out of scope:
- Issues in third-party dependencies (report to the upstream project)
- Issues requiring physical access to the device
- Social engineering

## Privacy commitment

ctok collects no telemetry by default. When telemetry is opted in, only anonymous event names, app version, and platform are sent - never prompt content, file names, or any personally identifiable information.
