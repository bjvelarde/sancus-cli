# Framework Pack Template

A Sancus framework pack adds security detection for a specific framework or library.

## What is a framework pack?

A framework pack uses `initialize()` to detect whether the target project actually
uses the framework, then applies framework-specific rules to relevant files.
Unlike a language pack, a framework pack is opt-in per project — it skips
itself gracefully when the framework is absent.

**Good framework pack candidates:**
- Django (Python)
- Rails (Ruby)
- Spring Boot (Java)
- FastAPI (Python)
- Laravel (PHP)
- Vue / Nuxt (JavaScript)

## Getting Started

```bash
cp -r templates/framework-pack packages/my-framework-pack
cd packages/my-framework-pack
npm install
```

Then follow the `TODO` markers in each file:

| File | What to do |
|---|---|
| `package.json` | Update `name`, `description`, `author`, `keywords` |
| `src/index.ts` | Update `metadata`, `files` glob, `initialize()` detection logic |
| `src/rules/misconfiguration.ts` | Implement real misconfiguration patterns |
| `src/rules/insecure-patterns.ts` | Implement real insecure usage patterns |
| `src/index.test.ts` | Add test fixtures with real vulnerable code samples |

## Framework Detection Pattern

```typescript
async initialize(context: PluginContext): Promise<void> {
  const raw = await context.fs.readFile("package.json");
  const pkg = JSON.parse(raw);
  const version = pkg.dependencies?.["your-framework"] ?? null;
  if (!version) {
    context.logger.warn("Framework not detected — skipping");
    state.skip = true;
    return;
  }
  state.frameworkDetected = true;
  state.frameworkVersion = version;
}
```

Then guard `detect()`:

```typescript
async detect(file, context) {
  if (state.skip) return [];
  // ... run rules
}
```

## File Targeting

Scope your `files` globs to paths meaningful for your framework:

```typescript
files: [
  "**/app/controllers/**/*.rb",   // Rails controllers
  "**/config/routes.rb",          // Rails routes
  "**/app/models/**/*.rb",        // Rails models
],
```

## Common Framework Rule Categories

| File | Rule examples |
|---|---|
| `misconfiguration.ts` | Debug mode on, weak session keys, permissive CORS |
| `insecure-patterns.ts` | Mass assignment, missing auth checks, unsafe redirects |
| Add `authentication.ts` | Missing `before_action`, unauthenticated endpoints |
| Add `injection.ts` | Framework-specific injection patterns |

## Commands

```bash
npm run typecheck   # tsc --noEmit — must be clean before publishing
npm test            # run the vitest test suite
npm run build       # compile to dist/
```

## Manifest Fields (B3)

```typescript
sdkVersion: "1.0.0",
engineCompatibility: ">=0.2.0",
capabilities: ["filesystem"],
```
