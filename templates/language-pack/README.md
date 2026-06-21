# Language Pack Template

A Sancus language pack adds security detection for a new programming language.

## What is a language pack?

A language pack targets files by extension and scans their content for
vulnerabilities. It differs from a framework pack in that it applies broadly
to all projects using the language, not just projects using a specific library.

**Good language pack candidates:**
- Ruby (`.rb`)
- Go (`.go`)
- Rust (`.rs`)
- PHP (`.php`)
- Swift (`.swift`)

## Getting Started

```bash
cp -r templates/language-pack packages/my-language-pack
cd packages/my-language-pack
npm install
```

Then follow the `TODO` markers in each file:

| File | What to do |
|---|---|
| `package.json` | Update `name`, `description`, `author`, `keywords` |
| `src/index.ts` | Update `metadata`, `files` glob, rule calls |
| `src/rules/injection.ts` | Implement real injection detection patterns |
| `src/rules/insecure-apis.ts` | Implement real insecure API patterns |
| `src/index.test.ts` | Add test fixtures with real vulnerable code samples |

## Adding New Rule Files

1. Create `src/rules/your-rule.ts` following the same pattern as `injection.ts`.
2. Export your function from `src/rules/index.ts`.
3. Import and call it in `src/index.ts` inside `detect()`.
4. Add tests in `src/index.test.ts`.

## File Targeting

```typescript
files: [
  "**/*.rb",   // All Ruby files
  "**/*.erb",  // ERB templates
],
```

The engine calls `detect()` once per matched file, passing a `ScannedFile`:

```typescript
interface ScannedFile {
  path: string;      // absolute path
  content: string;   // full file contents
  lines: string[];   // content.split("\n")
  extension?: string;
}
```

## Writing Rules

Each rule function receives `(content: string, filePath: string)` and returns
`Finding[]`. Keep rules focused — one file per concern area.

```typescript
export function detectSqlInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const pattern = /YourPattern/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: "your-language/sql-injection",
      severity: "critical",
      confidence: "high",
      message: "...",
      recommendation: "...",
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      category: "Security",
    });
  }
  return findings;
}
```

## Commands

```bash
npm run typecheck   # tsc --noEmit — must be clean before publishing
npm test            # run the vitest test suite
npm run build       # compile to dist/
```

## Manifest Fields (B3)

Populate these in `metadata` so the engine can validate compatibility:

```typescript
sdkVersion: "1.0.0",          // minimum @sancus/plugin-sdk version required
engineCompatibility: ">=0.2.0", // semver range of supported engine versions
capabilities: ["filesystem"],  // what your plugin needs from the engine
```
