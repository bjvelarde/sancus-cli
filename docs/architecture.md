# Sancus Architecture Overview

Audience: plugin authors and contributors who need to understand the structural decisions behind Sancus and the boundary model that governs it.

---

## The Two-Repository Model

Sancus is split across two repositories by design:

| Repository | Visibility | Owns |
|---|---|---|
| `sancus-cli` | Public | CLI, `@sancus/plugin-sdk`, templates, examples, marketplace client, developer tooling |
| `sancus-core` | Private | Scan engine, AST, rule engine, findings pipeline, reporting engine, licensing, marketplace runtime, commercial packs |

The split is not cosmetic. It enforces the boundary at the filesystem level.

A plugin author who has access only to `sancus-cli` physically cannot import from `sancus-core`. There is no convention, linter rule, or code review process preventing the dependency — there is no dependency to prevent because the package does not exist in their environment. The architecture makes the wrong thing impossible, not just discouraged.

`sancus-core` must never expose internal implementation details through the SDK. `sancus-cli` must never contain proprietary detection logic, licensing implementation, or commercial engine features. These are hard repository-level constraints, not style guidelines.

---

## The Boundary Principle

From the Sancus Constitution:

> The SDK owns abstractions (contracts). The Engine owns implementations.

Concretely, this means:

- `@sancus/plugin-sdk` defines interfaces — `SancusPlugin`, `Finding`, `PluginContext`, `PluginMetadata`, `ScannedFile`, `Logger`, `FileSystemUtils`, etc. It never contains business logic.
- `sancus-core` implements these interfaces. It never redefines them. The engine imports from the SDK just as an external plugin would.
- Plugins depend only on `@sancus/plugin-sdk`. They never import from `sancus-core` or any engine-internal package.
- The engine is the first consumer of the SDK, not a special case. If the engine cannot build on the SDK contracts alone, the contracts are incomplete — and the fix is to improve the SDK, not to grant the engine a bypass.

```
┌─────────────────────────────────────────────┐
│              sancus-cli (public)            │
│                                             │
│  @sancus/plugin-sdk  <── plugin authors     │
│  (contracts only)         depend here       │
└────────────────┬────────────────────────────┘
                 │ implements
                 v
┌─────────────────────────────────────────────┐
│             sancus-core (private)           │
│                                             │
│  scan engine · AST · rule engine            │
│  findings pipeline · licensing              │
└─────────────────────────────────────────────┘
```

The SDK exposes business concepts only. It must never expose AST internals, scanner state, rule engine internals, licensing primitives, marketplace internals, registry, cache, or any other engine concept. `PluginContext` represents only the services intentionally exposed to plugins. Engine configuration remains private.

### SDK contract ownership

The following types are owned by the SDK. The engine implements them but must not redefine them:

| Contract | Owner |
|---|---|
| `PluginMetadata` | SDK |
| `SancusPlugin` | SDK |
| `Finding` | SDK |
| `Severity` | SDK |
| `Confidence` | SDK |
| `Logger` | SDK (contract) |
| `FileSystemUtils` | SDK (contract) |
| `ScannedFile` | SDK |
| `PluginContext` | SDK (interface only) |
| `PluginConfig` | SDK (plugin configuration only) |

---

## Plugin Lifecycle (Runtime)

This is what happens, in order, from the moment the engine decides to run a plugin against a project:

```
  Discovery
      |
      v
  Validation  <-- sdkVersion, engineCompatibility, capabilities (B4)
      |
      v
    Load       <-- import module, read sancusPlugin export
      |
      v
  Initialize   <-- plugin.initialize(context)  [if present, once per session]
      |
      v
   Detect      <-- plugin.detect(file, context)  [once per matched file]
      |
      v
    Enrich     <-- engine stamps id, tool, workspace, cvssScore onto findings
      |              plugin never sees or produces these fields
      v
  PostScan     <-- plugin.postScan(findings, context)  [if present]
      |
      v
   Report      <-- findings flow to reporters
```

### Step details

1. **Discovery** — The engine locates the plugin package (from the marketplace, a local `node_modules` path, or an explicit file reference).

2. **Validation** — The engine calls `validatePlugin()`, checking `metadata.sdkVersion` against the running SDK, `metadata.engineCompatibility` against `ENGINE_VERSION`, and declared `capabilities`. A plugin that fails validation is rejected before any code runs. (Milestone B4.)

3. **Load** — The engine imports the module and reads the `sancusPlugin` named export. If the export is absent or malformed, load fails loudly.

4. **Initialize** — If `plugin.initialize` is present, the engine calls it once with a scoped `PluginContext`. This is the plugin's opportunity to load configuration, warm caches, or validate prerequisites. It is called at most once per scan session and always after version validation.

5. **Detect** — The engine calls `plugin.detect(file, context)` for each file that matches the plugin's declared file patterns. Calls are sequential for a given plugin — never concurrent. The plugin receives a `ScannedFile` and must return `Finding[]`. It must not throw for "no findings" — return `[]`.

6. **Enrich** — After `detect()` returns, the engine stamps engine-internal fields (`id`, `tool`, `workspace`, `cvssScore`, and others) onto each finding to produce a `CoreFinding`. The plugin never produces or receives these fields. This step is invisible to plugin authors.

7. **PostScan** — If `plugin.postScan` is present, the engine calls it with the full `Finding[]` for the scan session. The plugin may aggregate, deduplicate, or filter. It must return a findings array — never `null` or `undefined`.

8. **Report** — The enriched `CoreFinding[]` flows to reporters. Plugins have no visibility into this step.

---

## Finding Boundary

There are two finding types in Sancus. Plugin authors only interact with one of them.

### `Finding` (SDK)

The lean public contract that plugins produce. It contains what the plugin knows: the rule, the location, the severity, the message. Nothing more.

```typescript
// @sancus/plugin-sdk
export interface Finding {
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  message: string;
  file: string;       // relative to projectRoot
  line?: number;
  column?: number;
  evidence?: string;
}
```

### `CoreFinding` (engine-internal)

Extends `Finding` with fields the engine is responsible for computing and stamping. Plugin authors never see this type.

```typescript
// sancus-core — internal, never exported via SDK
interface CoreFinding extends Finding {
  id: string;              // stable content-addressed ID
  tool: string;            // originating plugin id
  workspace: string;       // absolute workspace path (engine-resolved)
  cvssScore?: number;      // computed by engine rule engine
  // ...additional engine enrichment fields
}
```

The reason `Finding` in the SDK does not have `cvssScore`, `workspace`, or `id` is not an oversight. Those are engine responsibilities. A plugin has no basis for computing a CVSS score — it does not have access to the full project context, rule weighting configuration, or scoring model. Keeping these fields out of `Finding` prevents plugins from producing values the engine would have to validate or override anyway.

---

## The Plugin Contract

### What the engine guarantees to plugins

- `context.fs` paths are relative to `projectRoot`. The engine never exposes absolute filesystem paths to plugins.
- `context.logger` is scoped per-plugin. The engine prefixes and routes output — plugins log freely without polluting global output.
- `context.config.projectRoot` is always an absolute path — the one exception where an absolute path appears, because the plugin needs an anchor.
- `detect()` is called once per matched file. Calls for the same plugin are never concurrent.
- `initialize()` is called at most once per scan session.
- Engine version and SDK version are validated before `initialize()` is ever called. A plugin will never enter `initialize()` with an incompatible runtime.

### What plugins must guarantee to the engine

- `detect()` always returns an array. "No findings" is `[]`, not a thrown error.
- `postScan()` returns a findings array. Never `null`, never `undefined`.
- `metadata.id` is unique. Two plugins with the same ID cannot coexist — the second one fails to load.
- The `ScannedFile` passed to `detect()` is never mutated. It is shared state; mutations would corrupt parallel plugin execution.

---

## Versioning Policy

SDK versioning follows semver with explicit semantics:

| Change | Version bump | Meaning |
|---|---|---|
| Breaking change to a public contract | Major | Plugins may break; migration required |
| New optional fields, new exports | Minor | Backward compatible; no plugin changes required |
| Bug fix, documentation, internal refactor | Patch | No contract change |

Plugin metadata encodes two version constraints:

```typescript
export interface PluginMetadata {
  id: string;
  sdkVersion: string;            // minimum SDK version required by this plugin
  engineCompatibility: string;   // semver range of supported engine versions
  // ...
}
```

- `sdkVersion` pins the minimum `@sancus/plugin-sdk` version the plugin requires. The engine rejects plugins whose `sdkVersion` exceeds the installed SDK.
- `engineCompatibility` is a semver range. The engine validates it against `ENGINE_VERSION` (declared in `sancus-core`) before loading. A plugin targeting `^2.0.0` will not load against an engine running `1.x`.

Both checks happen during the Validation step (B4), before any plugin code executes. Runtime version incompatibilities are not a thing in Sancus — they are caught at load time.

---

## What Plugin Authors Must Never Do

These are not suggestions. Violations of these rules are either caught at load time or produce behavior the engine cannot guarantee.

**Never import from `sancus-core` or any engine-internal package.**
`sancus-core` is a private repository. Any dependency on it from a plugin creates a hard coupling to engine internals that can break without notice.

**Never depend on `CoreFinding`, `EngineFinding`, or any engine type.**
These types do not exist in `@sancus/plugin-sdk`. If you are reaching for them, your plugin is doing something the engine is supposed to do.

**Never assume `Finding` fields beyond what `@sancus/plugin-sdk` declares.**
The engine may add fields internally, but those fields are not part of your contract. Code that reads engine-internal fields from a `Finding` is relying on undocumented behavior.

**Never access the filesystem outside `context.fs`.**
Direct `fs` calls are acceptable in local developer tooling but are not permitted in marketplace plugins. The engine sandboxes plugin filesystem access through `context.fs` for security and portability reasons.

**Never store mutable global state across plugin instances.**
State within a single scan session (initialized in `initialize()`, used in `detect()`, cleared in `postScan()`) is fine. Global module-level mutation that persists across sessions is not — it creates non-deterministic behavior when the engine reuses the module across scans.

**Never throw from `detect()` for normal "not found" cases.**
`detect()` returning `[]` is the correct signal that no findings were produced for a file. Throwing forces the engine to treat the plugin as failed and may suppress findings from earlier files. Reserve throws for genuine unrecoverable errors.
