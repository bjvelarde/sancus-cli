# Sancus Plugin API Specification

**Sancus plugins** extend the security scanner with custom detectors for your framework or application-specific patterns.

> **Version 1.0** - Stable, compatible with @sancus/plugin-sdk v1.0.0+

## Quick Start

Install the plugin SDK:

```bash
npm install --save-dev @sancus/plugin-sdk
```

Create a TypeScript plugin:

```typescript
import {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from '@sancus/plugin-sdk';

export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: 'my-detector',
    name: 'My Custom Detector',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Detects custom security patterns',
  },

  files: ['**/*.{ts,tsx,js,jsx}'],

  async detect(
    file: ScannedFile,
    context: PluginContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    // Scan file.content and file.lines
    // Create Finding objects
    return findings;
  },

  // Optional hooks
  async initialize?(context: PluginContext): Promise<void>;
  async postScan?(findings: Finding[], context: PluginContext): Promise<Finding[]>;
};
```

## Plugin Lifecycle

### 1. Initialize (optional)

Called once at the start, before any files are scanned. Use for:

- Detecting framework presence
- Loading configuration
- Validating environment
- Logging startup information

```typescript
async initialize(context: PluginContext): Promise<void> {
  const hasNextJs = await context.fs.fileExists('next.config.js');
  if (!hasNextJs) {
    context.logger.info('Next.js not detected; skipping checks');
    // Set plugin state to skip detection
  }
}
```

### 2. Detect (required)

Called for each file matched by `files` globs. Must return findings.

```typescript
async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  // Analyze file.content, file.lines, file.path
  // Return array of Finding objects
  return findings;
}
```

### 3. PostScan (optional)

Called once after all files are scanned. Use for:

- Correlating findings across files
- Generating aggregate reports
- Deduplicating or ranking findings

```typescript
async postScan(
  findings: Finding[],
  context: PluginContext
): Promise<Finding[]> {
  // Process and return findings
  return findings;
}
```

## PluginMetadata Interface

Required metadata for plugin identification:

```typescript
interface PluginMetadata {
  id: string;              // Unique identifier (lowercase, hyphens)
  name: string;            // Human-readable display name
  version: string;         // Semantic versioning (e.g., "1.0.0")
  author: string;          // Author or maintainer
  description: string;     // What does this plugin detect?
  repository?: string;     // Optional: repository URL
  homepage?: string;       // Optional: documentation or landing page URL
  license?: string;        // Optional: license type (e.g., "MIT")
  keywords?: string[];     // Optional: searchable keywords
  tags?: string[];         // Optional: marketplace taxonomy tags
  engines?: {              // Optional: SDK version constraint
    sdk: string;           // e.g., ">=1.0.0"
  };
  capabilities?: string[]; // Optional: declared engine capabilities required
                           // e.g., ["filesystem", "ast"]
}
```

## Finding Interface

A security finding returned by your plugin:

```typescript
interface Finding {
  // Identity
  ruleId?: string;         // Machine-readable rule identifier (e.g., "NO_EVAL")
  type?: string;           // Finding type / category slug
  title?: string;          // Short human-readable title

  // Message
  message: string;         // Required: user-friendly description of the issue

  // Detail
  description?: string;    // Extended explanation of the vulnerability
  recommendation?: string; // How to fix it

  // Classification
  severity: Severity;      // Required: 'critical' | 'high' | 'medium' | 'low' | 'info'
  confidence?: Confidence; // 'high' | 'medium' | 'low'
  category?: string;       // e.g., "injection", "misconfiguration"

  // Location
  location?: string;       // "path/file.ts:123"
  lineRange?: string;      // "123" or "123-125"
  codeSnippet?: string;    // The problematic code

  // References
  cve?: string;            // CVE identifier (e.g., "CVE-2021-44228")
  references?: string[];   // Links to advisories, CWE entries, docs

  // Extension
  metadata?: Record<string, unknown>; // Plugin-specific data
}
```

### Severity Values

```typescript
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

### Confidence Values

```typescript
type Confidence = 'high' | 'medium' | 'low';
```

## PluginContext Interface

Context passed to all plugin methods:

```typescript
interface PluginContext {
  logger: Logger;          // Structured logging
  fs: FileSystemUtils;     // Safe file system access
  config: PluginConfig;    // Plugin configuration
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

## Examples

See the `examples/` directory for complete working plugins:

- **hello-world-plugin** - Minimal example with basic detection
- **custom-report-plugin** - Demonstrates `postScan()` hook and aggregation
- **framework-detector-plugin** - Demonstrates `initialize()` hook and conditional scanning

## Testing Your Plugin

Run Sancus with your local plugin:

```bash
npx sancus scan . --plugins ./path/to/your-plugin.ts
```

For development, watch for changes and rebuild:

```bash
tsc --watch
```

## Publishing

1. **Prepare your package** with proper `package.json`:

   ```json
   {
     "name": "@sancus/your-detector",
     "version": "1.0.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "files": ["dist"]
   }
   ```

2. **Build your plugin**:

   ```bash
   tsc
   ```

3. **Publish to npm**:

   ```bash
   npm publish
   ```

4. **Users can install and use it**:
   ```bash
   npm install @sancus/your-detector
   npx sancus scan .
   ```

Sancus auto-discovers plugins matching `@sancus/*` naming convention.

## Best Practices

✅ **Be specific** - Return only high-confidence findings  
✅ **Be clear** - Provide actionable recommendations  
✅ **Be tested** - Include test fixtures and validate against real projects  
✅ **Be documented** - Add comments explaining detection logic  
✅ **Be safe** - Use `context.fs` for sandboxed file access, never throw from detect()  
✅ **Be efficient** - Cache initialization results across files

## Migration from Legacy API

If you have plugins written for the old API, update them:

| Old                     | New                                        |
| ----------------------- | ------------------------------------------ |
| `name: 'id'`            | `metadata: { id, name, ... }`              |
| `detect(file, context)` | `detect(file, context)` ✓ (same signature) |
| `initialize(context)`   | `initialize(context)` ✓ (same signature)   |
| `cvssScore`             | removed — use `references[]` for CVE links |
| –                       | `postScan(findings, context)` (new hook)   |
| –                       | `ruleId`, `title`, `description` (new fields) |

See [Migration Guide](../docs/migration-guide.md) for a full walkthrough.

## Reference

- **@sancus/plugin-sdk** - [Full API documentation](../packages/plugin-sdk/README.md)
- **Developer Docs** - [docs/](../docs/) — Architecture, API Reference, Extension Guide, Migration Guide
- **Examples** - [Working code samples](../examples/)
