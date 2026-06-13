/**
 * @sancus/plugin-sdk
 *
 * Public API for Sancus plugin development
 */

export type {
  PluginMetadata,
  Severity,
  Confidence,
  Finding,
  Logger,
  FileSystemUtils,
  PluginConfig,
  PluginContext,
  ScannedFile,
  SancusPlugin,
} from "./types.js";

export { createLogger } from "./utils/logger.js";
export { createFileSystemUtils } from "./utils/file-system.js";
