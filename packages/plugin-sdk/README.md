# @sancus/plugin-sdk

Official SDK for creating security plugins for **Sancus** — the language-aware security scanner.

## Installation

```bash
npm install --save-dev @sancus/plugin-sdk
```

Or with pnpm:

```bash
pnpm add -D @sancus/plugin-sdk
```

## Quick Start

### 1. Create a Plugin

Create a file `my-plugin.ts`:

```typescript
import {
  SancusPlugin,
  PluginMetadata,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

const metadata: PluginMetadata = {
  id: "my-security-detector",
  name: "My Security Detector",
  version: "1.0.0",
  author: "Your Name",
  description: "Detects specific security issues in code",
  keywords: ["security", "detection"],
};

export const sancusPlugin: SancusPlugin = {
  metadata,
  files: ["**/*.ts", "**/*.tsx"], // Only scan TypeScript files

  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Example: Detect console.log usage
    const lines = file.lines;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("console.log")) {
        findings.push({
          type: "console-log-found",
          severity: "low",
          location: `${file.path}:${i + 1}`,
          lineRange: String(i + 1),
          codeSnippet: lines[i].trim(),
          confidence: "high",
          message: "Avoid console.log in production code",
          recommendation: "Use a proper logger instead",
          category: "Best Practice",
        });
      }
    }

    return findings;
  },
};
```

### 2. Test Your Plugin

```bash
# Point Sancus to your plugin during development
npx sancus scan . --plugins ./my-plugin.ts
```

### 3. Publish to npm

```bash
npm publish
```

Then users can install and use it:

```bash
npm install @yourscope/my-security-detector

npx sancus scan .
```

Sancus will auto-discover plugins installed in `node_modules` that follow the naming convention `@sancus/*` or `sancus-plugin-*`.

---

## Plugin Interface

### SancusPlugin

The main interface for a Sancus plugin:

```typescript
interface SancusPlugin {
  metadata: PluginMetadata;
  files?: string[];
  initialize?(context: PluginContext): Promise<void>;
  detect(file: ScannedFile, context: PluginContext): Promise<Finding[]>;
  postScan?(findings: Finding[], context: PluginContext): Promise<Finding[]>;
}
```

#### Fields

- **metadata** (required): Identifies and describes the plugin
- **files** (optional): Glob patterns for files to scan. If omitted, all files are passed to `detect()`
- **initialize()** (optional): Called once before scanning begins. Use for setup and validation
- **detect()** (required): Called for each file. Must return an array of findings
- **postScan()** (optional): Called once after all files are scanned. Use for correlation and aggregation

---

## PluginMetadata

Required metadata for plugin discovery:

```typescript
interface PluginMetadata {
  id: string; // Unique identifier, lowercase with hyphens
  name: string; // Human-readable name
  version: string; // Semantic versioning (e.g., "1.0.0")
  author: string; // Author or maintainer
  description: string; // What does this plugin detect?
  repository?: string; // Optional: repo URL
  license?: string; // Optional: license (e.g., "MIT")
  keywords?: string[]; // Optional: discoverable keywords
}
```

---

## PluginContext

Context object passed to plugin methods:

```typescript
interface PluginContext {
  logger: Logger; // Logging utilities
  fs: FileSystemUtils; // Safe file system access
  config: PluginConfig; // Plugin configuration
}
```

### Logger

```typescript
interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}
```

### FileSystemUtils

```typescript
interface FileSystemUtils {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  getProjectRoot(): string;
}
```

---

## Finding

A security finding detected by your plugin:

```typescript
interface Finding {
  type: string; // Unique identifier (e.g., "console-log-found")
  severity: Severity; // 'critical' | 'high' | 'medium' | 'low' | 'info'
  location: string; // "path/file.ts:123"
  lineRange: string; // "123" or "123-125"
  codeSnippet: string; // The problematic code
  confidence: Confidence; // 'high' | 'medium' | 'low'
  message: string; // User-friendly description
  recommendation: string; // How to fix it
  category?: string; // e.g., "Security", "Best Practice"
  cvssScore?: number; // CVSS v3.1 score (0-10) if applicable
  metadata?: Record<string, unknown>; // Plugin-specific data
}
```

---

## Examples

### Initialize Hook

Use `initialize()` to validate dependencies or set up state:

```typescript
export const sancusPlugin: SancusPlugin = {
  metadata: {
    /* ... */
  },

  async initialize(context: PluginContext) {
    const hasGraphQL = await context.fs.fileExists("schema.graphql");
    if (!hasGraphQL) {
      context.logger.warn("No schema.graphql found; skipping GraphQL checks");
    }
  },

  async detect(file, context) {
    // Scanning logic
    return [];
  },
};
```

### PostScan Hook

Use `postScan()` to correlate findings:

```typescript
export const sancusPlugin: SancusPlugin = {
  metadata: {
    /* ... */
  },

  async detect(file, context) {
    // Each file returns findings
    return findings;
  },

  async postScan(findings, context) {
    // Correlate findings across the project
    const correlatedFindings: Finding[] = [];

    // Example: Group related security issues
    const issuesByType = new Map<string, Finding[]>();
    for (const finding of findings) {
      if (!issuesByType.has(finding.type)) {
        issuesByType.set(finding.type, []);
      }
      issuesByType.get(finding.type)!.push(finding);
    }

    // Create high-level summaries
    for (const [type, items] of issuesByType) {
      if (items.length > 5) {
        context.logger.warn(
          `Found ${items.length} instances of ${type}. Consider a systematic fix.`,
        );
      }
    }

    return findings;
  },
};
```

---

## Testing

Unit testing is crucial for plugin reliability. Here's how to test your SDK usage:

### Testing Your Plugin Code

Use **Vitest** (included in @sancus/plugin-sdk devDependencies):

```bash
npm install --save-dev vitest @vitest/ui
```

Create a test file `my-plugin.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sancusPlugin } from "./my-plugin";

describe("My Security Plugin", () => {
  it("should detect console.log statements", async () => {
    const mockContext = {
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
      fs: {
        readFile: async () => "",
        fileExists: async () => false,
        getProjectRoot: () => "/",
      },
      config: {},
    };

    const findings = await sancusPlugin.detect(
      {
        path: "test.js",
        content: 'console.log("hello");',
        lines: ['console.log("hello");'],
      },
      mockContext,
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("console-log-found");
  });

  it("should return empty array for clean code", async () => {
    const findings = await sancusPlugin.detect(
      {
        path: "test.js",
        content: "const x = 1;",
        lines: ["const x = 1;"],
      },
      mockContext,
    );

    expect(findings).toHaveLength(0);
  });
});
```

Run tests:

```bash
npm test
npm run test:coverage  # Check coverage
npm run test:ui       # Interactive UI
```

### SDK Unit Tests

The @sancus/plugin-sdk itself includes comprehensive tests:

```bash
cd packages/plugin-sdk
pnpm test       # Run all SDK tests
pnpm test:ui    # Interactive UI
```

Tests cover:

- ✅ Type definitions and interfaces
- ✅ Logger utility with prefixing
- ✅ FileSystemUtils sandboxing
- ✅ Public API exports
- ✅ Plugin lifecycle hooks

### Testing Best Practices

1. **Test detection logic** - Create fixtures for each rule
2. **Mock the context** - Provide stub logger, fs, config
3. **Test edge cases** - Empty files, large files, unicode, etc.
4. **Verify recommendations** - Ensure findings have actionable advice
5. **Test lifecycle hooks** - If using initialize() or postScan()
6. **Measure coverage** - Aim for 80%+ code coverage

---

## Best Practices

1. **Be Specific with Findings**: Return only high-confidence findings. Each false positive damages trust.

2. **Provide Clear Recommendations**: Users should understand exactly how to fix each issue.

3. **Use Metadata for Plugins**: Always include `id`, `name`, `version`, `author`, and `description`.

4. **Handle Errors Gracefully**: If your plugin fails, use `context.logger.error()` and return an empty findings array rather than throwing.

5. **Document Your Checks**: Add comments explaining what patterns you detect and why they matter.

6. **Test Thoroughly**: Include test fixtures and run your plugin against real projects before publishing.

---

## Support & Contributing

- **GitHub**: [sancus-project/sancus-cli](https://github.com/sancus-project/sancus-cli)
- **Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas

---

## License

MIT
