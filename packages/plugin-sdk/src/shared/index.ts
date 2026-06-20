// Re-export shared interfaces
export type { Logger, FileSystemUtils } from "./types.js";

// Re-export factory functions from their existing locations
// (utils/ files are canonical — shared/ delegates to them)
export { createLogger } from "../utils/logger.js";
export { createFileSystemUtils } from "../utils/file-system.js";
