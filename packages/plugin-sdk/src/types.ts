/**
 * @sancus/plugin-sdk — public type barrel
 *
 * This file exists for backward compatibility.
 * All types are now organized under domain sub-folders:
 *   src/plugin/   — plugin authoring types
 *   src/finding/  — finding types
 *   src/shared/   — shared utilities/interfaces
 *
 * Any import of the form:
 *   import type { Finding } from "@sancus/plugin-sdk"
 * continues to work unchanged.
 */
export type { PluginMetadata, PluginConfig, PluginContext, ScannedFile, SancusPlugin } from "./plugin/index.js";
export type { Finding, Severity, Confidence } from "./finding/index.js";
export type { Logger, FileSystemUtils } from "./shared/types.js";
