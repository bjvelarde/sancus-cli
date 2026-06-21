# Extension Authoring Guide

This guide walks you through building, testing, and publishing a Sancus plugin from scratch. By the end you will have a working plugin that detects security-relevant TODO comments, a full test suite, and a published npm package.

---

## 1. Prerequisites

Before you start, confirm you have:

- Node.js ≥ 18 (`node --version`)
- TypeScript ≥ 5.0 (`tsc --version`)
- An npm account if you plan to publish (`npm whoami`)

`@sancus/plugin-sdk` is installed as a dev dependency in the next step — you do not need it globally.

---

## 2. Choose Your Extension Type

Pick the type that matches what you are building.

| Type | When to use | Key characteristic |
|---|---|---|
| **Language pack** | Detecting issues in a new programming language | Matched by file extension via `files` glob |
| **Framework pack** | Detecting framework-specific issues (e.g. Next.js, Django) | Uses `initialize()` to confirm the framework is present before scanning |
| **Reporter extension** | Custom output format (JSON, SARIF, HTML, etc.) | Implements `postScan()`; `detect()` always returns `[]` |

If you are unsure, start with a language or framework pack — they share the same shape. Copy the relevant template from `templates/` in the `sancus-cli` repository as your starting point.

---

## 3. Scaffold the Package

### Step 1 — Create the directory structure

```bash
mkdir sancus-plugin-security-todos
cd sancus-plugin-security-todos
mkdir src
```

### Step 2 — Create `package.json`

```json
{
  "name": "@your-org/sancus-plugin-security-todos",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest --run --configLoader runner",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "@sancus/plugin-sdk": "^1.0.0"
  },
  "devDependencies": {
    "@sancus/plugin-sdk": "^1.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

`@sancus/plugin-sdk` is listed as both a `peerDependency` and a `devDependency`. The peer dependency tells consuming projects what they need to supply at runtime; the dev dependency gives you types and type-checking during development.

### Step 3 — Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

### Step 4 — Install dependencies

```bash
npm install
```

---

## 4. Write the Plugin

### Step 5 — Create `src/index.ts`

The plugin below detects TODO-style comments that also contain security-sensitive keywords — a common class of deferred security debt that slips into production unaddressed.

```typescript
import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: "security-todos",
    name: "@your-org/sancus-plugin-security-todos",
    version: "1.0.0",
    author: "Your Name",
    description: "Flags security-relevant TODO comments for review",
    keywords: ["todos", "comments", "security"],
    sdkVersion: "1.0.0",
    engineCompatibility: ">=0.2.0",
    capabilities: ["filesystem"],
  },

  // Glob patterns that control which files the engine passes to detect().
  // Files that do not match are never loaded — keep this as narrow as reasonable.
  files: ["**/*.{ts,tsx,js,jsx,py,rb,go}"],

  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Match single-line comment markers followed by a TODO-class keyword,
    // then a security-sensitive term anywhere on the same line.
    const pattern =
      /\/\/\s*(TODO|FIXME|HACK|UNSAFE)[:\s].*?(auth|cred|secret|sql|inject|xss|csrf)/gi;

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(file.content)) !== null) {
      // Count newlines before match.index to derive the 1-based line number.
      const lineNum =
        (file.content.substring(0, match.index).match(/\n/g) ?? []).length + 1;

      findings.push({
        ruleId: "security-todos/flagged-comment",
        severity: "medium",
        confidence: "medium",
        message: `Security-relevant TODO comment: "${match[0].trim()}"`,
        recommendation: "Resolve this TODO before deploying to production.",
        location: `${file.path}:${lineNum}`,
        lineRange: String(lineNum),
        codeSnippet: file.lines[lineNum - 1]?.trim() ?? "",
        category: "Security",
      });
    }

    return findings;
  },
};

export default sancusPlugin;
```

#### What each metadata field does

| Field | Purpose |
|---|---|
| `id` | Globally unique identifier used in the plugin registry. Use reverse-domain or scoped-package style. |
| `sdkVersion` | The minimum SDK version your plugin requires. Set this to the oldest version you have tested against. |
| `engineCompatibility` | SemVer range of Sancus engine versions this plugin supports. The engine checks this before loading. |
| `capabilities` | Declares which platform services you use. `"filesystem"` is required if you read `file.content` or use `context.fs`. |

---

## 5. Organise Rules (for larger plugins)

A single `detect()` function becomes hard to maintain once you have more than two or three independent detection patterns. Split rules into separate files under `src/rules/`.

### Rule file shape

Each rule file exports a single pure function. It takes the file content and path, and returns findings. It does not touch the network, the filesystem, or any shared state.

```typescript
// src/rules/flagged-comments.ts
import type { Finding } from "@sancus/plugin-sdk";

export function detectFlaggedComments(
  content: string,
  filePath: string
): Finding[] {
  const findings: Finding[] = [];
  const pattern =
    /\/\/\s*(TODO|FIXME|HACK|UNSAFE)[:\s].*?(auth|cred|secret|sql|inject|xss|csrf)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const lineNum =
      (content.substring(0, match.index).match(/\n/g) ?? []).length + 1;
    findings.push({
      ruleId: "security-todos/flagged-comment",
      severity: "medium",
      confidence: "medium",
      message: `Security-relevant TODO comment: "${match[0].trim()}"`,
      recommendation: "Resolve this TODO before deploying to production.",
      location: `${filePath}:${lineNum}`,
      lineRange: String(lineNum),
      codeSnippet: "",
      category: "Security",
    });
  }

  return findings;
}
```

### Barrel export

```typescript
// src/rules/index.ts
export { detectFlaggedComments } from "./flagged-comments.js";
```

### Revised `src/index.ts` (structural sketch)

```typescript
import type { SancusPlugin, ScannedFile, PluginContext, Finding } from "@sancus/plugin-sdk";
import { detectFlaggedComments } from "./rules/index.js";

export const sancusPlugin: SancusPlugin = {
  metadata: { /* ... same as before ... */ },
  files: ["**/*.{ts,tsx,js,jsx,py,rb,go}"],

  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    return [
      ...detectFlaggedComments(file.content, file.path),
      // add more rule calls here
    ];
  },
};

export default sancusPlugin;
```

This structure makes each rule independently testable and keeps `src/index.ts` as a thin coordinator.

---

## 6. Write Tests

### Step 6 — Create `src/index.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { sancusPlugin } from "./index.js";
import type { ScannedFile, PluginContext } from "@sancus/plugin-sdk";

// Minimal stub — tests only need the fields detect() actually reads.
function makeFile(content: string, path = "src/auth.ts"): ScannedFile {
  return {
    path,
    content,
    lines: content.split("\n"),
  } as ScannedFile;
}

// PluginContext is unused in this plugin, but detect() requires it.
const ctx = {} as PluginContext;

describe("sancusPlugin metadata", () => {
  it("has required fields", () => {
    const { metadata } = sancusPlugin;
    expect(metadata.id).toBeTruthy();
    expect(metadata.sdkVersion).toBeTruthy();
    expect(metadata.engineCompatibility).toBeTruthy();
    expect(Array.isArray(metadata.capabilities)).toBe(true);
  });

  it("declares filesystem capability", () => {
    expect(sancusPlugin.metadata.capabilities).toContain("filesystem");
  });
});

describe("detect() — positive cases", () => {
  it("flags a TODO with a security keyword", async () => {
    const file = makeFile("// TODO: fix sql injection here\nconst x = 1;\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings.length).toBeGreaterThan(0);
  });

  it("flags FIXME with auth keyword", async () => {
    const file = makeFile("// FIXME: auth logic is broken\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings.length).toBe(1);
  });

  it("flags HACK with xss keyword", async () => {
    const file = makeFile("// HACK: bypassing xss filter for now\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings.length).toBe(1);
  });

  it("reports location in path:line format", async () => {
    const file = makeFile("// TODO: csrf token check missing\n", "src/api.ts");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings[0].location).toMatch(/^src\/api\.ts:\d+$/);
  });

  it("returns findings with required fields", async () => {
    const file = makeFile("// TODO: secret management needed\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    const f = findings[0];
    expect(f.ruleId).toBeTruthy();
    expect(f.severity).toBeTruthy();
    expect(f.message).toBeTruthy();
    expect(f.location).toBeTruthy();
  });
});

describe("detect() — negative cases", () => {
  it("returns [] for clean content", async () => {
    const file = makeFile("const greeting = 'hello world';\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings).toEqual([]);
  });

  it("returns [] for a TODO without a security keyword", async () => {
    const file = makeFile("// TODO: rename this variable\n");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings).toEqual([]);
  });

  it("returns [] for an empty file", async () => {
    const file = makeFile("");
    const findings = await sancusPlugin.detect!(file, ctx);
    expect(findings).toEqual([]);
  });
});
```

---

## 7. Verify Types

### Step 7 — Run the type checker

```bash
npm run typecheck
```

This must exit with zero errors before you publish. Fix all type errors now — the engine loads plugins dynamically, and a type mismatch that TypeScript would have caught can produce silent incorrect behavior at runtime.

---

## 8. Run the Tests

### Step 8 — Execute the test suite

```bash
npm test
```

If your environment restricts writes to `node_modules/.vite-temp/`, run Vitest directly:

```bash
npx vitest --run --configLoader runner
```

All tests must be green before proceeding.

---

## 9. Test Against a Real Project

### Step 9 — Build and run a local scan

```bash
npm run build
npx sancus scan /path/to/your-project --plugins ./dist/index.js
```

Point `--plugins` at the compiled entry point, not the source. Verify that:

- Findings appear for files you expect to be flagged.
- No findings appear for files that are clean.
- The `location` field in each finding references the correct file and line.
- No unhandled errors appear in the scan output.

If you want to test against a known fixture, create a small directory with one file containing a flagged comment and one file without, and scan that directory.

---

## 10. Publish

### Pre-publish checklist

Before running `npm publish`, confirm every item:

- [ ] `metadata.sdkVersion` is set to the minimum SDK version your plugin requires
- [ ] `metadata.engineCompatibility` is set to the engine range you have tested against
- [ ] `metadata.capabilities` declares every capability your plugin uses
- [ ] `metadata.id` is globally unique — check the Sancus plugin registry before choosing a name
- [ ] All tests pass (`npm test`)
- [ ] Type checker is clean (`npm run typecheck`)
- [ ] `dist/` is built (`npm run build`) and `files` in `package.json` includes it
- [ ] `README.md` documents what the plugin detects and how to configure it

### Step 10 — Publish to npm

```bash
npm run build
npm publish --access public
```

### Step 11 — Submit to the Sancus plugin registry

After the npm package is live, submit it to the Sancus plugin registry so it appears in the marketplace. Follow the instructions in `plugin-registry/README.md` in the `sancus-cli` repository.

---

## 11. Common Mistakes

### 1. Importing from engine internals

```typescript
// WRONG — sancus-core is private and its API is not stable
import { RuleEngine } from "sancus-core/engine";

// CORRECT — only import from the public SDK
import type { SancusPlugin } from "@sancus/plugin-sdk";
```

Imports from `sancus-core` will resolve during local development if you have the monorepo checked out, but will silently fail or behave incorrectly when your plugin is installed by a user who does not have it. The engine implements SDK contracts internally; your plugin must not depend on those implementations.

### 2. Returning `null` or `undefined` from `detect()`

```typescript
// WRONG — null/undefined will cause the engine to throw or produce corrupt output
async detect(file, ctx) {
  if (!file.content) return null as any;
}

// CORRECT — always return an array, even when empty
async detect(file, ctx) {
  if (!file.content) return [];
}
```

### 3. Mutating the `ScannedFile`

```typescript
// WRONG — ScannedFile is shared; mutations affect other plugins in the same scan
file.content = file.content.toLowerCase();

// CORRECT — work on a local copy
const content = file.content.toLowerCase();
```

### 4. Using absolute paths with `context.fs`

```typescript
// WRONG — absolute paths escape the project sandbox
const data = await context.fs.readFile("/etc/passwd");

// CORRECT — paths must be relative to the project root
const data = await context.fs.readFile("config/app.json");
```

`context.fs` resolves all paths relative to the project root that was passed to the scan. Absolute paths are not guaranteed to work and may be blocked in future engine versions.

### 5. Not declaring `engineCompatibility`

If `metadata.engineCompatibility` is absent, the engine has no way to know whether your plugin is compatible with its version. It may load your plugin against an engine version you have never tested, leading to unpredictable behavior. Always set this field, even if the range is broad (`">=0.1.0"`).

### 6. Throwing from `detect()` for "not found" cases

```typescript
// WRONG — throwing for a normal "no findings" case crashes the scan
async detect(file, ctx) {
  const match = file.content.match(pattern);
  if (!match) throw new Error("No match found");
}

// CORRECT — return an empty array; throw only for genuine unexpected errors
async detect(file, ctx) {
  const match = file.content.match(pattern);
  if (!match) return [];
}
```

The engine treats any thrown error from `detect()` as a plugin failure, which may abort the entire scan or suppress results from subsequent plugins. Return `[]` when there is nothing to report.
