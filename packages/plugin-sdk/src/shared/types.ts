// Domain: shared
// Owned by: @sancus/plugin-sdk
// Consumers: plugin/ domain + external plugin authors via PluginContext

/**
 * Structured logger provided to plugins via PluginContext.
 * Scoped per-plugin so the engine can prefix/route log output.
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Sandboxed filesystem utilities provided to plugins.
 * The engine may enforce path restrictions through this interface.
 */
export interface FileSystemUtils {
  /** Read a file as UTF-8 string */
  readFile(path: string): Promise<string>;
  /** Check whether a path exists */
  exists(path: string): Promise<boolean>;
  /** List directory entries */
  readDir(path: string): Promise<string[]>;
  /** Join path segments (platform-aware) */
  joinPath(...segments: string[]): string;
}
