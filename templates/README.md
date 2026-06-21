# Sancus Extension Templates

Official starter templates for building Sancus extensions.

## Available Templates

| Template | Description | Use when |
|---|---|---|
| [`language-pack/`](./language-pack/) | New language detector | Adding security detection for a programming language not yet supported |
| [`framework-pack/`](./framework-pack/) | Framework-specific detector | Adding rules for a specific framework or library (e.g. Django, Rails, Spring) |
| [`reporter-extension/`](./reporter-extension/) | Custom output formatter | Outputting findings in a custom format (SARIF, HTML, Slack, CSV, etc.) |

## Prerequisites

- Node.js ≥ 18
- `@sancus/plugin-sdk` v1.0.0 (installed as a `peerDependency`)
- TypeScript ≥ 5.0

## Quickstart

```bash
# 1. Copy the template that matches your use case
cp -r templates/language-pack my-language-pack
cd my-language-pack

# 2. Install dependencies (pointing at your local SDK or the published version)
npm install

# 3. Follow the TODO comments in src/index.ts and src/rules/
# 4. Verify types compile
npm run typecheck

# 5. Run the test harness
npm test

# 6. Build for distribution
npm run build
```

## Template Anatomy

Each template is a self-contained npm package:

```
<template-name>/
  package.json          — name, version, peerDependencies
  tsconfig.json         — strict ESNext, bundler module resolution
  src/
    index.ts            — SancusPlugin implementation with TODO markers
    rules/
      <rule>.ts         — one file per rule category
      index.ts          — rule barrel (re-exports)
    index.test.ts       — vitest test harness
  README.md             — template-specific instructions
```

## Key Contracts

All templates import exclusively from `@sancus/plugin-sdk`. Never import
from `sancus-core` or any engine-internal package — those are private.

```typescript
import type {
  SancusPlugin,   // the plugin contract you implement
  ScannedFile,    // file passed to detect()
  PluginContext,  // logger, fs, config
  Finding,        // what detect() returns
  PluginMetadata, // metadata block
} from "@sancus/plugin-sdk";
```

## Running Tests

Templates use [Vitest](https://vitest.dev/). Because Vitest ≥ 2 requires
a writable cache directory when using a TypeScript config, pass
`--configLoader runner` if your environment restricts writes to
`node_modules/.vite-temp/`:

```bash
# Standard (most environments)
npm test

# Restricted environments (CI containers, sandboxes)
npx vitest --run --configLoader runner
```

## Publishing to the Marketplace

Once your extension is ready:

1. Set `metadata.sdkVersion` and `metadata.engineCompatibility` accurately.
2. Ensure `metadata.capabilities` declares everything you use.
3. Publish to npm: `npm publish --access public`
4. Submit to the Sancus marketplace registry (see `plugin-registry/README.md`).
