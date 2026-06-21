# Migration Guide: pre-v1.0.0 → SDK 1.0.0

## Overview

The `@sancus/plugin-sdk` was reorganized in A2 into a domain-based internal structure, and the public contract was finalized in A3/A3.3. The change is purely structural — no runtime behavior changed, no detection logic changed. Old flat imports still work via a backward-compat re-export barrel (`types.ts`), but they are deprecated; the stable top-level barrel (`@sancus/plugin-sdk`) is now the canonical import path for all plugin authors.

---

## What Changed

### Import paths

The SDK used to export everything from a single flat barrel. It now uses domain organization internally, with a stable top-level barrel as the only public interface. Direct sub-path imports (e.g. `@sancus/plugin-sdk/finding/types`) were always unstable and must not be used.

**Before (pre-v1.0.0):**
```typescript
// These still work via backward-compat re-export, but are deprecated
import { SancusPlugin, Finding, PluginContext } from "@sancus/plugin-sdk";
// or direct domain paths (unstable, never do this)
import { Finding } from "@sancus/plugin-sdk/finding/types";
```

**After (v1.0.0):**
```typescript
// Use the top-level barrel — this is the stable, canonical import
import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
  PluginMetadata,
} from "@sancus/plugin-sdk";
import { createLogger, createFileSystemUtils } from "@sancus/plugin-sdk";
```

The top-level barrel (`@sancus/plugin-sdk`) is stable and versioned. All public types are re-exported from it. Use `import type` for type-only imports and plain `import` only for factory functions.

---

### Finding interface changes

The `Finding` interface was streamlined in v1.0.0 (A3.3). Several fields from pre-release versions are no longer part of the public contract — they are engine-internal and were always re-computed by the engine anyway. New fields were added to replace `type` as the preferred rule identifier.

| Field | Status | Where it lives now |
|---|---|---|
| `id` | Removed from SDK | Engine-assigned during dedup — plugin authors never set this |
| `workspace` | Removed from SDK | Engine stamps this during enrichment |
| `cvssScore` | Removed from SDK | Engine/rule-engine responsibility |
| `estimatedFixTime` | Removed from SDK | Engine guidance field |
| `backwardsCompatible` | Removed from SDK | Engine guidance field |
| `migrationNote` | Removed from SDK | Engine guidance field |
| `testFile` | Removed from SDK | Engine guidance field |
| `patchedVersions` | Removed from SDK | Dependency audit, engine-internal |
| `ruleId` | Added | Preferred over `type` for new plugins |
| `title` | Added | Optional human-readable title |
| `description` | Added | Optional detailed description |
| `references` | Added | Array of reference URLs |

**Migration action:** If your plugin was setting any of the removed fields, delete those assignments. They were never meaningful to the engine — the engine always re-computed them internally.

---

### PluginMetadata new fields (B3)

New optional fields were added to `PluginMetadata` in v1.0.0:

```typescript
metadata: {
  // existing required fields — unchanged
  id: "my-plugin",
  name: "...",
  version: "1.0.0",
  author: "...",
  description: "...",

  // NEW optional B3 fields — strongly recommended
  sdkVersion: "1.0.0",            // minimum SDK version required
  engineCompatibility: ">=0.2.0", // semver range of supported engine versions
  capabilities: ["filesystem"],   // what capabilities your plugin uses
  dependencies: [],               // other plugin packages this depends on
}
```

These fields are optional — existing plugins without them will still load. Adding them enables the engine's compatibility validation (B4) to surface clear errors instead of runtime failures.

---

## Step-by-Step Migration

### Step 1: Update the package

```bash
npm install --save-dev @sancus/plugin-sdk@^1.0.0
```

### Step 2: Update imports

Change all imports to use the top-level barrel. Use `import type` for types:

```typescript
// Before
import { SancusPlugin, Finding, PluginContext, ScannedFile } from "@sancus/plugin-sdk";

// After
import type { SancusPlugin, Finding, PluginContext, ScannedFile } from "@sancus/plugin-sdk";
import { createLogger } from "@sancus/plugin-sdk"; // only for factory functions
```

### Step 3: Remove engine-only fields from findings

```typescript
// Before — setting fields that no longer exist on Finding
findings.push({
  type: "sql-injection",
  severity: "critical",
  message: "...",
  location: "src/db.ts:42",
  cvssScore: 9.0,            // REMOVE — engine-only
  workspace: "backend",      // REMOVE — engine-only
  estimatedFixTime: "30min", // REMOVE — engine-only
  backwardsCompatible: false, // REMOVE — engine-only
});

// After — lean public contract
findings.push({
  ruleId: "sql-injection",   // preferred over type
  severity: "critical",
  message: "...",
  location: "src/db.ts:42",
  recommendation: "Use parameterized queries.",
});
```

### Step 4: Add B3 metadata fields

Add `sdkVersion`, `engineCompatibility`, and `capabilities` to your `metadata` object. See the [PluginMetadata new fields](#pluginmetadata-new-fields-b3) section above for the full shape.

### Step 5: Verify

```bash
npm run typecheck  # 0 errors
npm test           # all tests pass
```

---

## Backward Compatibility Guarantee

The top-level barrel (`@sancus/plugin-sdk`) will remain stable across all v1.x releases. No breaking changes will be made to exported types without a major version bump. Plugins that compile against v1.0.0 will continue to work with all v1.x engine releases that declare compatible `engineCompatibility`.

---

## Getting Help

If you encounter migration issues, open an issue in the `sancus-cli` repository. Include your current `@sancus/plugin-sdk` version and the TypeScript error output.
