import { promises as fs } from "fs";
import { join } from "path";
import type { FileSystemUtils } from "../types.js";

/**
 * Create file system utilities for a plugin
 * Provides safe, sandboxed file access within the project root
 */
export function createFileSystemUtils(projectRoot: string): FileSystemUtils {
  return {
    async readFile(path: string): Promise<string> {
      const fullPath = join(projectRoot, path);
      try {
        return await fs.readFile(fullPath, "utf-8");
      } catch (error) {
        throw new Error(`Failed to read file ${path}: ${error}`);
      }
    },

    async fileExists(path: string): Promise<boolean> {
      const fullPath = join(projectRoot, path);
      try {
        await fs.access(fullPath);
        return true;
      } catch {
        return false;
      }
    },

    getProjectRoot(): string {
      return projectRoot;
    },
  };
}
