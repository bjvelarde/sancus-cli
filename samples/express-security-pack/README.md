# @sancus/sample-express-security-pack

A **sample Sancus framework pack** demonstrating real, working security detection logic for [Express.js](https://expressjs.com/) applications.

This package is part of the official Sancus sample extensions suite (Milestone C3 — Sample Extensions). It is intended to be read alongside the [framework-pack template](../../templates/framework-pack/) and the [SDK API reference](../../docs/api-reference.md).

---

## What it is

Sancus plugins (framework packs) are TypeScript packages that implement the `SancusPlugin` interface from `@sancus/plugin-sdk`. They receive individual source files during a scan and return `Finding` objects describing security issues.

This pack detects **Express.js misconfigurations** and **insecure coding patterns** by running regex-based rules over `.ts` and `.js` files. It uses `initialize()` to confirm Express is present in the project before scanning, avoiding false positives on unrelated codebases.

---

## Rules

| Rule ID | Severity | Confidence | Description |
|---|---|---|---|
| `express/x-powered-by-enabled` | `low` | `high` | `app.set('x-powered-by', true)` explicitly re-enables the X-Powered-By response header, revealing framework identity to attackers. |
| `express/cors-wildcard-origin` | `medium` | `medium` | `origin: '*'` in a CORS configuration allows any domain to make cross-origin requests. Becomes critical when combined with `credentials: true`. |
| `express/json-body-no-limit` | `info` | `high` | `express.json()` called without a size limit — large payloads may exhaust server memory and cause denial-of-service. |
| `express/hardcoded-cookie-secret` | `high` | `high` | A string literal passed to `cookieParser('...')` — hardcoded signing secret is exposed in source control history. |
| `express/open-redirect` | `high` | `high` | `res.redirect(req.query/params/body.*)` — user-controlled input used as redirect target, enabling open-redirect phishing attacks. |
| `express/server-side-template-injection` | `critical` | `high` | `res.render(req.*)` — user-controlled input used as template name, potentially enabling server-side template injection (SSTI) and RCE. |
| `express/eval-user-input` | `critical` | `high` | `eval(req.*)` — request data passed directly to `eval()`, a complete remote code execution (RCE) vector. |
| `express/command-injection` | `critical` | `high` | `exec(req.*)` or `exec(\`...\${req.*}\`)` — user-controlled input passed to `child_process.exec()`, enabling OS command injection. |

---

## initialize() behavior

Before any files are scanned, the engine calls `initialize(context)`. This pack:

1. Attempts to read `package.json` from `context.config.projectRoot`.
2. Looks for `express` in `dependencies` or `devDependencies`.
3. **If Express is found** — logs `Express <version> detected — running security checks` and proceeds normally.
4. **If Express is not found** (or `package.json` is unreadable) — logs a warning and sets an internal skip flag. All subsequent `detect()` calls return an empty array immediately, producing no findings.

This prevents noise when the pack is loaded globally but the scanned project does not use Express.

---

## postScan() behavior

After all files are scanned, `postScan()` logs a brief severity breakdown:

```
[express-security-pack] Scan complete — 3 finding(s): 1 critical, 1 high, 1 medium.
```

If no findings are produced, it logs:

```
[express-security-pack] Scan complete — no security issues found.
```

---

## File structure

```
samples/express-security-pack/
  package.json              Package manifest
  tsconfig.json             TypeScript compiler config
  README.md                 This file
  src/
    index.ts                SancusPlugin implementation (entry point)
    rules/
      index.ts              Re-exports both rule modules
      misconfiguration.ts   Rules: x-powered-by, CORS, body limit, cookie secret
      insecure-patterns.ts  Rules: open redirect, SSTI, eval, command injection
    index.test.ts           Vitest unit tests
```

---

## How to build

```bash
# Install dependencies (requires the SDK to be built first)
npm install

# Compile TypeScript to dist/
npm run build

# Type-check only (no output)
npm run typecheck

# Remove compiled output
npm run clean
```

> **Note:** `@sancus/plugin-sdk` is a peer dependency. The `tsconfig.json` path mapping points to `../../packages/plugin-sdk/dist/index.d.ts` — build the SDK package first or adjust the path to your local setup.

---

## How to run tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and run in pure Node.js — no filesystem access, no Express app needed. Each rule function is tested directly with inline fixture strings.

---

## Writing your own framework pack

Use the [framework-pack template](../../templates/framework-pack/) as a starting point. The template provides the boilerplate `SancusPlugin` structure, a sample `initialize()` / `detect()` / `postScan()` lifecycle, and inline comments explaining each contract.

For the full SDK API reference — including all `Finding` fields, `PluginContext` services, and `PluginMetadata` options — see [../../docs/api-reference.md](../../docs/api-reference.md).

---

## License

MIT © Sancus Team
