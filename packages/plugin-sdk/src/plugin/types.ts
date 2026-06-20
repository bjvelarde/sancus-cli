// Domain: plugin
// Owned by: @sancus/plugin-sdk
// Consumers: external plugin authors

/**
 * Static metadata declared by a plugin author.
 * Embedded in every plugin package.
 */
export interface PluginMetadata {
  /** npm package name — must match package.json "name" */
  name: string;
  /** semver string */
  version: string;
  /** Human-readable description shown in marketplace listings */
  description: string;
  /** Optional hint for how severe findings from this plugin tend to be */
  severityHint?: "critical" | "high" | "medium" | "low" | "info";
}

/**
 * Runtime configuration injected by the engine when a plugin is loaded.
 */
export interface PluginConfig {
  /** Absolute path to the root of the project being scanned */
  projectRoot: string;
  /** Engine-provided options specific to this plugin invocation */
  options?: Record<string, unknown>;
}

/**
 * Execution context passed to plugin.detect().
 * Contains only what plugin authors need — no engine internals.
 */
export interface PluginContext {
  /** Structured logger scoped to this plugin */
  logger: import("../shared/types.js").Logger;
  /** Sandboxed filesystem utilities */
  fs: import("../shared/types.js").FileSystemUtils;
  /** Runtime config for this invocation */
  config: PluginConfig;
}

/**
 * A file that has been scanned and is available for plugin inspection.
 */
export interface ScannedFile {
  /** Absolute path to the file */
  path: string;
  /** File contents as UTF-8 string */
  content: string;
  /** File extension without leading dot (e.g. "ts", "py") */
  extension: string;
}

/**
 * The plugin contract. External plugin authors implement this interface.
 */
export interface SancusPlugin {
  metadata: PluginMetadata;
  detect(files: ScannedFile[], context: PluginContext): Promise<import("../finding/types.js").Finding[]>;
}
