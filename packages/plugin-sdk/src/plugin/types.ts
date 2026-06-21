// Domain: plugin
// Owned by: @sancus/plugin-sdk
// Consumers: external plugin authors

/**
 * Static metadata declared by a plugin author.
 * Embedded in every plugin package and displayed in marketplace listings.
 *
 * B3 additions (all optional — backward compatible):
 *   sdkVersion          — minimum @sancus/plugin-sdk version required
 *   engineCompatibility — semver range of engine versions this plugin supports
 *   capabilities        — declared capabilities the engine can check before loading
 *   dependencies        — other plugin package names this plugin depends on
 */
export interface PluginMetadata {
  // ── Identity ──────────────────────────────────────────────────────────────

  /**
   * Unique slug identifier (e.g. "react-security", "hardcoded-secrets").
   * URL-safe, lowercase, hyphen-separated.
   */
  id: string;

  /** npm package name — must match package.json "name" */
  name: string;

  /** Semantic version string (e.g. "1.0.0") */
  version: string;

  /** Author or maintainer name */
  author: string;

  /** Human-readable description shown in marketplace listings */
  description: string;

  // ── Discovery (optional) ──────────────────────────────────────────────────

  /** Plugin repository URL */
  repository?: string;

  /** SPDX license identifier (e.g. "MIT", "Apache-2.0") */
  license?: string;

  /** Search keywords for marketplace discoverability */
  keywords?: string[];

  /** Marketplace taxonomy tags (broader than keywords) */
  tags?: string[];

  /** Plugin documentation or landing page URL */
  homepage?: string;

  /** Engine/SDK version constraints */
  engines?: {
    /** Semver range for @sancus/plugin-sdk (e.g. ">=1.0.0") */
    sdk?: string;
  };

  /** Hint for how severe findings from this plugin tend to be */
  severityHint?: "critical" | "high" | "medium" | "low" | "info";

  // ── B3: Compatibility & Capabilities ─────────────────────────────────────

  /**
   * Minimum @sancus/plugin-sdk version this plugin requires.
   * Engine uses this for compatibility validation (B4).
   * Example: "0.2.0"
   */
  sdkVersion?: string;

  /**
   * Semver range of sancus engine versions this plugin supports.
   * Engine uses this for compatibility validation (B4).
   * Example: ">=1.0.0 <2.0.0"
   */
  engineCompatibility?: string;

  /**
   * Declared capabilities this plugin requires or provides.
   * Engine can check these before loading (B4).
   * Examples: ["ast", "filesystem", "network"]
   */
  capabilities?: string[];

  /**
   * Other plugin package names this plugin depends on.
   * Engine can pre-load dependencies in correct order (B4).
   * Example: ["@sancus/plugin-base-security"]
   */
  dependencies?: string[];
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
  [key: string]: unknown; // allow engine extensions without SDK changes
}

/**
 * A file that has been scanned and is available for plugin inspection.
 */
export interface ScannedFile {
  /** Absolute path to the file */
  path: string;
  /** File contents as UTF-8 string */
  content: string;
  /** File extension without leading dot (e.g. "ts", "py") — optional */
  extension?: string;
  /** Lines of the file, split on \n */
  lines: string[];
}

/**
 * The plugin contract. External plugin authors implement this interface.
 */
export interface SancusPlugin {
  metadata: PluginMetadata;

  /**
   * Glob patterns for files this plugin wants to inspect.
   * Defaults to all TypeScript/JavaScript files if omitted.
   */
  files?: string[];

  /**
   * Optional lifecycle hook called once before scanning begins.
   * Use to warm up state or validate prerequisites.
   */
  initialize?(context: PluginContext): Promise<void>;

  /**
   * Core detection method. Called once per matching file.
   */
  detect(file: ScannedFile, context: PluginContext): Promise<import("../finding/types.js").Finding[]>;

  /**
   * Optional post-scan hook. Called with all findings after all files processed.
   * Use for cross-file correlation, deduplication, or enrichment.
   */
  postScan?(findings: import("../finding/types.js").Finding[], context: PluginContext): Promise<import("../finding/types.js").Finding[]>;
}
