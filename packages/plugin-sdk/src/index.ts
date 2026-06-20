/**
 * @sancus/plugin-sdk — public API
 *
 * All types and utilities are re-exported from domain sub-folders.
 * Existing imports of the form:
 *   import { createLogger } from "@sancus/plugin-sdk"
 * continue to work unchanged.
 */

// --- Types (via domain barrels) ---
export type { PluginMetadata, PluginConfig, PluginContext, ScannedFile, SancusPlugin } from "./plugin/index.js";
export type { Finding, Severity, Confidence } from "./finding/index.js";
export type { Logger, FileSystemUtils } from "./shared/types.js";

// --- Factory utilities ---
export { createLogger } from "./utils/logger.js";
export { createFileSystemUtils } from "./utils/file-system.js";
