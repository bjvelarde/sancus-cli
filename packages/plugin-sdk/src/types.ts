/**
 * @sancus/plugin-sdk
 *
 * Core types and interfaces for Sancus plugins.
 * This package defines the stable public API for creating security plugins.
 */

/**
 * Metadata about a Sancus plugin.
 * Required for all plugins to ensure discoverability and proper identification.
 */
export interface PluginMetadata {
  /**
   * Unique identifier for the plugin (e.g., "react-security", "hardcoded-secrets")
   * Should be URL-safe and lowercase with hyphens.
   */
  id: string;

  /**
   * Human-readable name of the plugin (e.g., "React Security Detector")
   */
  name: string;

  /**
   * Semantic version (e.g., "1.0.0")
   */
  version: string;

  /**
   * Author or maintainer name(s)
   */
  author: string;

  /**
   * Short description of what the plugin detects (e.g., "Detects unsafe DOM operations in React components")
   */
  description: string;

  /**
   * Plugin repository URL (optional but recommended)
   */
  repository?: string;

  /**
   * Plugin license (optional, e.g., "MIT")
   */
  license?: string;

  /**
   * Keywords for discoverability (optional, e.g., ["react", "security", "dom"])
   */
  keywords?: string[];
}

/**
 * Severity level of a security finding
 */
export type Severity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Confidence level of the detection
 */
export type Confidence = "high" | "medium" | "low";

/**
 * A security finding detected by a plugin
 */
export interface Finding {
  /**
   * Unique identifier for the issue type (e.g., "unsafe-dom-operation", "hardcoded-secret")
   */
  type: string;

  /**
   * Severity level of this finding
   */
  severity: Severity;

  /**
   * File path and line number (e.g., "src/app.tsx:42")
   */
  location: string;

  /**
   * Line range as string (e.g., "42" or "42-45")
   */
  lineRange: string;

  /**
   * The actual code snippet that triggered the finding
   */
  codeSnippet: string;

  /**
   * Confidence level in this detection
   */
  confidence: Confidence;

  /**
   * Human-readable description of the issue
   */
  message: string;

  /**
   * Recommended fix or mitigation
   */
  recommendation: string;

  /**
   * Category for grouping findings (e.g., "Security", "Best Practice")
   */
  category?: string;

  /**
   * CVSS v3.1 score (0-10) if applicable
   */
  cvssScore?: number;

  /**
   * Additional metadata (plugin-specific)
   */
  metadata?: Record<string, unknown>;
}

/**
 * Logger interface provided to plugins via PluginContext
 */
export interface Logger {
  /**
   * Log a debug message
   */
  debug(message: string, data?: unknown): void;

  /**
   * Log an informational message
   */
  info(message: string, data?: unknown): void;

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void;

  /**
   * Log an error message
   */
  error(message: string, data?: unknown): void;
}

/**
 * File system utilities provided to plugins via PluginContext
 */
export interface FileSystemUtils {
  /**
   * Read a file's contents as a string
   */
  readFile(path: string): Promise<string>;

  /**
   * Check if a file exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Get the root directory of the project being scanned
   */
  getProjectRoot(): string;
}

/**
 * Configuration object passed to plugins during initialization.
 * projectRoot is always provided by the engine.
 */
export interface PluginConfig {
  /**
   * Root directory of the project being scanned.
   * Always set by the engine — plugins may rely on this being present.
   */
  projectRoot: string;

  /**
   * Custom configuration for this plugin (loaded from sancus.config.js or .sancusrc)
   */
  options?: Record<string, unknown>;
}

/**
 * Context object provided to plugins during their lifecycle
 */
export interface PluginContext {
  /**
   * Logger instance for the plugin
   */
  logger: Logger;

  /**
   * File system utilities
   */
  fs: FileSystemUtils;

  /**
   * Plugin-specific configuration
   */
  config: PluginConfig;
}

/**
 * File being scanned
 */
export interface ScannedFile {
  /**
   * Relative path to the file from project root
   */
  path: string;

  /**
   * Full file contents
   */
  content: string;

  /**
   * File contents split by line (for easier indexing)
   */
  lines: string[];
}

/**
 * Main plugin interface
 *
 * Example:
 * ```ts
 * export const sancusPlugin: SancusPlugin = {
 *   metadata: {
 *     id: 'react-security',
 *     name: 'React Security Detector',
 *     version: '1.0.0',
 *     author: 'Sancus Team',
 *     description: 'Detects unsafe DOM operations in React'
 *   },
 *
 *   files: ['**\/*.tsx?'],
 *
 *   async detect(file, context) {
 *     // Scan the file and return findings
 *     return [];
 *   }
 * };
 * ```
 */
export interface SancusPlugin {
  /**
   * Required metadata identifying the plugin
   */
  metadata: PluginMetadata;

  /**
   * Glob patterns for files this plugin should scan
   * e.g., ['**\/*.ts', '**\/*.tsx', '**\/*.js', '**\/*.jsx']
   * If omitted, all files are passed to detect()
   */
  files?: string[];

  /**
   * Optional initialization hook called once before scanning begins
   * Use this to set up any global state or perform expensive operations
   */
  initialize?(context: PluginContext): Promise<void>;

  /**
   * Core detection function called for each file
   * Must return an array of findings (can be empty)
   */
  detect(file: ScannedFile, context: PluginContext): Promise<Finding[]>;

  /**
   * Optional post-processing hook called once after all files have been scanned
   * Use this to correlate findings, aggregate results, etc.
   */
  postScan?(findings: Finding[], context: PluginContext): Promise<Finding[]>;
}
