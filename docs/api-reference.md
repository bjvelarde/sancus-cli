# `@sancus/plugin-sdk` API Reference

Version: **1.0.0** — Stable public API

This document is the authoritative reference for all exported symbols in `@sancus/plugin-sdk`. It targets third-party plugin authors building Sancus extensions. Familiarity with TypeScript is assumed; no knowledge of Sancus engine internals is required or expected.

---

## All Exports

| Symbol | Kind | Description |
|---|---|---|
| `SancusPlugin` | Interface | Top-level plugin contract every plugin must implement |
| `PluginMetadata` | Interface | Plugin identity and manifest fields |
| `PluginConfig` | Interface | Project-level configuration passed to a plugin |
| `PluginContext` | Interface | Runtime services injected into plugin lifecycle hooks |
| `ScannedFile` | Interface | A single file presented to `detect` for analysis |
| `Finding` | Interface | A security or quality issue reported by a plugin |
| `Severity` | Type alias | Severity level for a finding |
| `Confidence` | Type alias | Confidence level for a finding |
| `Logger` | Interface | Structured logging service provided via `PluginContext` |
| `FileSystemUtils` | Interface | Sandboxed filesystem service provided via `PluginContext` |
| `createLogger` | Function | Factory — creates a scoped `Logger` instance |
| `createFileSystemUtils` | Function | Factory — creates a sandboxed `FileSystemUtils` instance |

---

## Import Patterns

### Canonical import

Use the top-level barrel export for all standard plugin authoring:

```typescript
import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
  PluginMetadata,
  Severity,
  Confidence,
  Logger,
  FileSystemUtils,
} from "@sancus/plugin-sdk";
import { createLogger, createFileSystemUtils } from "@sancus/plugin-sdk";
```

### Domain sub-imports (advanced)

The SDK is organized into logical internal domains (`plugin`, `finding`, `language`, `text`, `shared`). These sub-paths may be imported directly for tree-shaking in advanced toolchains. The top-level barrel is preferred for all standard use cases and is always backward-compatible.

```typescript
// Example: direct domain import (advanced use only)
import type { Finding, Severity } from "@sancus/plugin-sdk/finding";
```

Do not depend on sub-import paths for stable production plugins unless explicitly documented as stable. The top-level barrel is the stable surface.

---

## Plugin Lifecycle

### Overview

```
Engine startup
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Load phase                                     │
│  1. Resolve plugin package                      │
│  2. Import default export (SancusPlugin object) │
│  3. Validate metadata fields                    │
│  4. Validate sdkVersion / engineCompatibility   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  initialize(context)          [optional]        │
│  Called once before any files are scanned.      │
│  Use for: loading config, warming caches,       │
│  reading auxiliary files.                       │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │  For each file in   │
          │  the scan target    │
          ▼                     │
┌─────────────────────┐         │
│  detect(file,       │         │
│    context)         │◄────────┘
│  Returns Finding[]  │
│  Called once per    │
│  matched file.      │
└─────────┬───────────┘
          │  (all files processed)
          ▼
┌─────────────────────────────────────────────────┐
│  postScan(findings, context)  [optional]        │
│  Receives the full aggregate Finding[] across   │
│  all files. Use for: cross-file correlation,    │
│  deduplication, aggregate rule logic.           │
│  Returns a (possibly modified) Finding[].       │
└─────────────────────────────────────────────────┘
                     │
                     ▼
              Engine reports results
```

### Load order

1. The engine resolves plugins in the order declared in scan configuration.
2. `metadata` is read and validated synchronously at load time.
3. `initialize` is called once per plugin, sequentially, before any scanning begins. If `initialize` throws, the plugin is disabled for the current scan and the engine logs the error.
4. `detect` is called once per file that matches the plugin's declared `files` glob patterns (or all files if `files` is omitted). A thrown error from `detect` is caught by the engine; the file is skipped for that plugin and the error is logged.
5. `postScan` is called once after all files have been processed. A thrown error cancels any modifications postScan would have made; the findings collected during `detect` are used as-is.

### Error handling expectations

- Lifecycle methods must not crash the host process. Throw errors for unrecoverable conditions; the engine catches and logs them.
- Use `context.logger.error` for internal errors that are recoverable from the plugin's perspective.
- Do not write to `process.stdout` / `process.stderr` directly; always use `context.logger`.

---

## Interfaces

### `SancusPlugin`

The top-level contract. Every plugin must export a default value that satisfies this interface.

```typescript
export interface SancusPlugin {
  metadata: PluginMetadata;
  files?: string[];
  initialize?(context: PluginContext): Promise<void>;
  detect(file: ScannedFile, context: PluginContext): Promise<Finding[]>;
  postScan?(findings: Finding[], context: PluginContext): Promise<Finding[]>;
}
```

| Member | Type | Required | Description |
|---|---|---|---|
| `metadata` | `PluginMetadata` | Yes | Plugin identity and manifest. Validated by the engine at load time. |
| `files` | `string[]` | No | Glob patterns (relative to `projectRoot`) that restrict which files are passed to `detect`. When omitted, `detect` is called for every file in the scan target. |
| `initialize` | `(context: PluginContext) => Promise<void>` | No | Called once before scanning begins. Use to load configuration, open connections, or warm caches. |
| `detect` | `(file: ScannedFile, context: PluginContext) => Promise<Finding[]>` | Yes | Core analysis method. Called once per matched file. Return an empty array if no issues are found. |
| `postScan` | `(findings: Finding[], context: PluginContext) => Promise<Finding[]>` | No | Called after all files are processed. Receives the full aggregated findings list. Must return a `Finding[]` (the same array, a filtered subset, or an augmented set). |

---

### `PluginMetadata`

Describes the plugin identity and declares compatibility requirements. All fields except `id`, `name`, `version`, `author`, and `description` are optional but recommended.

```typescript
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  severityHint?: "critical" | "high" | "medium" | "low" | "info";
  // B3 compatibility fields:
  sdkVersion?: string;
  engineCompatibility?: string;
  capabilities?: string[];
  dependencies?: string[];
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique reverse-domain identifier for the plugin. Example: `"com.example.my-plugin"`. Must be stable across versions. |
| `name` | `string` | Yes | Human-readable display name. Example: `"My Security Plugin"`. |
| `version` | `string` | Yes | Semantic version string (`MAJOR.MINOR.PATCH`). Example: `"1.0.0"`. |
| `author` | `string` | Yes | Author name or organization. Example: `"Acme Corp"`. |
| `description` | `string` | Yes | One-line description of what the plugin detects or provides. |
| `repository` | `string` | No | URL to the plugin's source repository. |
| `license` | `string` | No | SPDX license identifier. Example: `"MIT"`, `"Apache-2.0"`. |
| `keywords` | `string[]` | No | Categorization tags used by the marketplace for discovery. |
| `severityHint` | `"critical" \| "high" \| "medium" \| "low" \| "info"` | No | Default severity the plugin is expected to emit. Used by tooling and dashboards; does not constrain `Finding.severity`. |
| `sdkVersion` | `string` | No | Minimum `@sancus/plugin-sdk` version this plugin requires. Semver range or exact version. Example: `"^1.0.0"`. |
| `engineCompatibility` | `string` | No | Semver range of Sancus engine versions the plugin is compatible with. Example: `">=2.0.0 <3.0.0"`. Validated by the engine at load time (Milestone B4+). |
| `capabilities` | `string[]` | No | Named capabilities the plugin requires from the engine. The engine may reject the plugin if a required capability is unavailable. |
| `dependencies` | `string[]` | No | Other plugin IDs this plugin depends on. The engine ensures dependencies are loaded first. |

---

### `PluginConfig`

Plugin-specific configuration provided by the user's scan configuration. The engine populates this and injects it into `PluginContext`.

```typescript
export interface PluginConfig {
  projectRoot: string;
  options?: Record<string, unknown>;
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `projectRoot` | `string` | Yes | Absolute path to the root of the project being scanned. All relative paths in `FileSystemUtils` are resolved against this value. |
| `options` | `Record<string, unknown>` | No | Arbitrary key-value options passed from the scan configuration to the plugin. Read these via `context.config.options` in lifecycle methods. |

---

### `PluginContext`

The runtime services container injected into every lifecycle method. Provides structured logging, sandboxed filesystem access, and plugin configuration. The index signature (`[key: string]: unknown`) allows the engine to attach additional services in future versions without breaking the interface.

```typescript
export interface PluginContext {
  logger: Logger;
  fs: FileSystemUtils;
  config: PluginConfig;
  [key: string]: unknown;
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `logger` | `Logger` | Yes | Scoped structured logger. Use instead of `console.*` for all plugin output. |
| `fs` | `FileSystemUtils` | Yes | Sandboxed filesystem utilities. All paths are relative to `config.projectRoot`. |
| `config` | `PluginConfig` | Yes | Plugin-specific configuration for the current scan. |
| `[key: string]` | `unknown` | — | Extension point. The engine may attach additional services. Do not depend on engine-specific keys in portable plugins. |

---

### `ScannedFile`

Represents a single file passed to `detect`. The engine pre-populates all fields; plugins receive them as read-only values.

```typescript
export interface ScannedFile {
  path: string;
  content: string;
  extension?: string;
  lines: string[];
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | `string` | Yes | Path to the file, relative to `projectRoot`. Example: `"src/auth/login.ts"`. |
| `content` | `string` | Yes | Full text content of the file as a UTF-8 string. |
| `extension` | `string` | No | File extension without the leading dot. Example: `"ts"`, `"py"`, `"json"`. May be absent for files without an extension. |
| `lines` | `string[]` | Yes | The file content split into individual lines (without newline characters). `lines[0]` is line 1. Use this for line-indexed access rather than splitting `content` manually. |

---

### `Finding`

A single security or quality issue reported by a plugin. Only `message` and `severity` are required. All other fields are optional but strongly recommended for high-quality findings.

Engine-managed fields (`id`, `workspace`, `cvssScore`, timestamps) are computed by the engine after findings are collected and are not part of the SDK contract. Do not set them.

```typescript
export interface Finding {
  ruleId?: string;
  type?: string;
  title?: string;
  message: string;
  description?: string;
  recommendation?: string;
  severity: Severity;
  confidence?: Confidence;
  location?: string;
  lineRange?: string;
  codeSnippet?: string;
  category?: string;
  cve?: string | null;
  references?: string[];
  metadata?: Record<string, unknown>;
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `ruleId` | `string` | No | Machine-readable rule identifier. Preferred over `type` for new plugins. Example: `"no-hardcoded-secret"`. Should be stable across plugin versions. |
| `type` | `string` | No | Legacy rule identifier field. Accepted for backward compatibility. Prefer `ruleId` in new plugins. |
| `title` | `string` | No | Short human-readable title for the finding. Example: `"Hardcoded API key detected"`. Displayed in reports and dashboards. |
| `message` | `string` | Yes | The primary finding message. Should be specific and actionable. Example: `"API key assigned to constant 'API_KEY' at line 12."`. |
| `description` | `string` | No | Extended explanation of the issue. May include context, root cause, and affected behavior. Supports plain text; Markdown rendering is engine-dependent. |
| `recommendation` | `string` | No | Concrete remediation advice for the developer. Example: `"Move secrets to environment variables and use a secrets manager."`. |
| `severity` | `Severity` | Yes | The severity level of the finding. See `Severity`. |
| `confidence` | `Confidence` | No | How confident the plugin is that this is a true positive. See `Confidence`. |
| `location` | `string` | No | File path and position. Format: `"path/to/file.ts:LINE"` or `"path/to/file.ts:LINE:COL"`. Path must be relative to `projectRoot`. Example: `"src/config.ts:42"` or `"src/config.ts:42:8"`. |
| `lineRange` | `string` | No | Range of lines the finding spans. Format: `"START-END"`. Example: `"42-47"`. Use when the issue covers multiple lines. |
| `codeSnippet` | `string` | No | The relevant source code excerpt. Keep to the minimum context needed to understand the issue (typically 1–5 lines). |
| `category` | `string` | No | Classification category. Example: `"injection"`, `"secrets"`, `"authentication"`. Used for filtering and grouping in reports. |
| `cve` | `string \| null` | No | CVE identifier if the finding maps to a known vulnerability. Example: `"CVE-2021-44228"`. Set to `null` explicitly to indicate the field was considered and no CVE applies. |
| `references` | `string[]` | No | Array of URLs to relevant documentation, advisories, or standards. Example: `["https://cwe.mitre.org/data/definitions/798.html"]`. |
| `metadata` | `Record<string, unknown>` | No | Arbitrary plugin-defined data attached to the finding. Useful for passing extra context to `postScan` or downstream consumers. Not rendered in standard reports. |

#### `ruleId` vs `type`

Use `ruleId` in all new plugins. It is the canonical machine-readable identifier for a rule and is used for suppression, deduplication, and configuration overrides.

`type` is accepted for backward compatibility with plugins written before `ruleId` was introduced. When both are present, `ruleId` takes precedence in engine logic that supports it.

---

### `Logger`

Structured logging service. Always use the logger instead of `console.*` to ensure output is routed correctly by the engine (respecting verbosity flags, log sinks, and test capture).

```typescript
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
```

| Method | Description |
|---|---|
| `info(message, ...args)` | General operational messages. Use for scan progress, loaded configuration, file counts. |
| `warn(message, ...args)` | Non-fatal conditions that may indicate a problem. Use for missing optional config, unexpected but recoverable states. |
| `error(message, ...args)` | Errors that prevented normal operation. Use when a detection step fails and the result is incomplete or skipped. |
| `debug(message, ...args)` | Verbose diagnostic output. Only shown in debug mode. Use freely for internal state, matched patterns, AST node details. |

Additional args (`...args`) are formatted using the engine's log formatter (printf-style or structured, depending on engine configuration).

---

### `FileSystemUtils`

A sandboxed filesystem service. All paths must be relative to `projectRoot`. Absolute paths are not supported and will cause an error. The engine enforces the sandbox boundary.

```typescript
export interface FileSystemUtils {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  getProjectRoot(): string;
  readDir?(path: string): Promise<string[]>;
  joinPath?(...segments: string[]): string;
}
```

| Method | Type | Required | Description |
|---|---|---|---|
| `readFile` | `(path: string) => Promise<string>` | Yes | Reads a file and returns its content as a UTF-8 string. Path must be relative to `projectRoot`. Throws if the file does not exist. |
| `fileExists` | `(path: string) => Promise<boolean>` | Yes | Returns `true` if the file exists at the given relative path, `false` otherwise. Does not throw for missing files. |
| `getProjectRoot` | `() => string` | Yes | Returns the absolute path of the project root directory. Use this only when an absolute path is unavoidable (e.g. passing to a third-party library). |
| `readDir` | `(path: string) => Promise<string[]>` | No | Lists the entries (files and directories) in a directory at the given relative path. Returns an array of entry names (not full paths). May be absent in some engine versions; check before calling. |
| `joinPath` | `(...segments: string[]) => string` | No | Joins path segments using the OS path separator. Equivalent to `path.join(...segments)`. Provided as a convenience to avoid importing Node's `path` module directly. May be absent in some engine versions; check before calling. |

---

## Type Aliases

### `Severity`

```typescript
export type Severity = "critical" | "high" | "medium" | "low" | "info";
```

| Value | Meaning | Example use cases |
|---|---|---|
| `"critical"` | Immediate risk of exploitation or data loss. Requires urgent remediation. | Remote code execution, authentication bypass, plaintext storage of credentials |
| `"high"` | Significant security risk. Should be remediated before release. | SQL injection, hardcoded secrets, insecure deserialization |
| `"medium"` | Moderate risk. Exploitable under specific conditions or in combination with other issues. | Missing input validation, insecure redirects, weak cryptographic algorithms |
| `"low"` | Minor risk or defense-in-depth issue. Acceptable to defer but should be tracked. | Missing security headers, overly broad CORS policy, verbose error messages |
| `"info"` | Informational. No direct security impact. Used for policy observations or best-practice violations. | Deprecated API usage, missing documentation, style deviations with security implications |

Choose severity based on the impact if the issue is exploited in isolation, assuming a motivated attacker. Do not inflate severity to increase visibility.

---

### `Confidence`

```typescript
export type Confidence = "high" | "medium" | "low";
```

| Value | When to use |
|---|---|
| `"high"` | The detection is definitive. The pattern is unambiguous and false positives are rare. Example: a literal secret string matching a known format with high entropy. |
| `"medium"` | The detection is likely correct but context could change the assessment. Example: a variable named `password` assigned a value — might be a real secret or a test fixture. |
| `"low"` | The detection is speculative or heuristic. High false-positive rate is expected. Example: a generic string that could be a secret depending on how it is used. |

When `confidence` is omitted, consumers should treat it as `"medium"`. For `"low"` confidence findings, always include a clear `description` explaining why the result may be a false positive.

---

## Factory Utilities

### `createLogger`

```typescript
function createLogger(name: string): Logger
```

Creates a scoped `Logger` instance bound to the given name. The name is prepended to log output to identify the source. Primarily useful in tests and local development where a real `PluginContext` is not available.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Scope name prepended to all log output. Typically the plugin `id` or test name. |

Returns: `Logger`

```typescript
import { createLogger } from "@sancus/plugin-sdk";

const logger = createLogger("com.example.my-plugin");
logger.info("Plugin initialized");
// output: [com.example.my-plugin] Plugin initialized
```

---

### `createFileSystemUtils`

```typescript
function createFileSystemUtils(projectRoot: string): FileSystemUtils
```

Creates a sandboxed `FileSystemUtils` instance rooted at `projectRoot`. All relative paths passed to the returned instance are resolved against `projectRoot`. Primarily useful in tests and local development where a real `PluginContext` is not available.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectRoot` | `string` | Yes | Absolute path to the project root directory. All relative paths will be resolved against this value. |

Returns: `FileSystemUtils`

```typescript
import { createFileSystemUtils } from "@sancus/plugin-sdk";

const fs = createFileSystemUtils("/home/user/my-project");
const content = await fs.readFile("src/config.ts");
const exists = await fs.fileExists("package.json");
```

---

## Finding Construction Patterns

### Minimal finding (required fields only)

```typescript
const finding: Finding = {
  message: "Hardcoded secret detected in source file.",
  severity: "high",
};
```

Valid but provides minimal context. Sufficient for initial prototyping; not recommended for production plugins.

### Full finding (all recommended fields)

```typescript
const finding: Finding = {
  ruleId: "no-hardcoded-secret",
  title: "Hardcoded API key detected",
  message: `API key assigned to constant 'API_KEY' at line 12.`,
  description:
    "A hardcoded API key was found in the source code. Committing secrets to version control exposes them to anyone with repository access and makes rotation difficult.",
  recommendation:
    "Remove the hardcoded value. Store secrets in environment variables and access them via process.env. Use a secrets manager for production workloads.",
  severity: "high",
  confidence: "high",
  location: "src/config.ts:12:14",
  lineRange: "12-12",
  codeSnippet: `const API_KEY = "sk-proj-abc123...";`,
  category: "secrets",
  cve: null,
  references: [
    "https://cwe.mitre.org/data/definitions/798.html",
    "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password",
  ],
  metadata: {
    matchedPattern: "sk-proj-[a-zA-Z0-9]{20,}",
    entropy: 4.7,
  },
};
```

### Location format

```
"src/file.ts:42"       // line only
"src/file.ts:42:8"     // line and column (1-indexed)
```

- Path is always relative to `projectRoot`.
- Line numbers are 1-indexed.
- Column numbers are 1-indexed.
- Use `lineRange` for multi-line findings in addition to `location` (which points to the start).

```typescript
// Single-line finding
location: `${file.path}:${lineNumber}`,

// Single-line finding with column
location: `${file.path}:${lineNumber}:${columnNumber}`,

// Multi-line finding
location: `${file.path}:${startLine}`,
lineRange: `${startLine}-${endLine}`,
```

### Building location from `ScannedFile`

```typescript
async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    const lineNumber = i + 1; // lines[] is 0-indexed; location is 1-indexed

    if (/sk-proj-[a-zA-Z0-9]{20,}/.test(line)) {
      findings.push({
        ruleId: "no-hardcoded-secret",
        title: "Hardcoded API key detected",
        message: `Potential API key found at line ${lineNumber}.`,
        severity: "high",
        confidence: "medium",
        location: `${file.path}:${lineNumber}`,
        codeSnippet: line.trim(),
      });
    }
  }

  return findings;
}
```

---

## Versioning and Stability

### SDK stability

`@sancus/plugin-sdk` v1.0.0 is the stable public API. All exported types, interfaces, and functions listed in this document are stable. No breaking changes will be introduced without a major version bump (`2.0.0`).

Additive changes (new optional fields, new optional methods) may be introduced in minor versions (`1.1.0`, `1.2.0`). Plugins that compile against `^1.0.0` will remain compatible.

### Declaring SDK requirements

Use `metadata.sdkVersion` to declare the minimum SDK version your plugin requires:

```typescript
metadata: {
  id: "com.example.my-plugin",
  // ...
  sdkVersion: "^1.0.0",
}
```

The engine validates this field before loading the plugin (Milestone B4+). Plugins that omit `sdkVersion` are assumed to be compatible with the running SDK version.

### Declaring engine compatibility

Use `metadata.engineCompatibility` to declare the range of engine versions your plugin supports:

```typescript
metadata: {
  id: "com.example.my-plugin",
  // ...
  engineCompatibility: ">=2.0.0 <3.0.0",
}
```

Values must be valid semver ranges. The engine validates this at load time and rejects plugins that declare incompatibility with the running engine version.

### What the SDK does not expose

The SDK exposes only the abstractions needed to write plugins. It intentionally excludes:

- AST infrastructure
- Rule engine internals
- Licensing and marketplace APIs
- Engine configuration
- Scanner implementation details
- Reporting engine

Plugins that depend on engine internals are not portable and will break across engine versions. If a capability you need is absent from this SDK, request it via the SDK repository's issue tracker rather than reaching into engine packages.
