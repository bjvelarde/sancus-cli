import { Logger } from "../types.js";

/**
 * Create a simple logger for plugins
 * Prefixes all messages with the plugin name for clarity in logs
 */
export function createLogger(pluginName: string): Logger {
  return {
    debug(message: string, data?: unknown) {
      console.debug(`[${pluginName}] ${message}`, data ?? "");
    },
    info(message: string, data?: unknown) {
      console.info(`[${pluginName}] ${message}`, data ?? "");
    },
    warn(message: string, data?: unknown) {
      console.warn(`[${pluginName}] ${message}`, data ?? "");
    },
    error(message: string, data?: unknown) {
      console.error(`[${pluginName}] ${message}`, data ?? "");
    },
  };
}
