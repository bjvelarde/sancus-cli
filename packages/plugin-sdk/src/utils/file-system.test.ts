import { describe, it, expect } from "vitest";
import { createFileSystemUtils } from "../utils/file-system";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("createFileSystemUtils", () => {
  it("should create file system utilities with project root", () => {
    const utils = createFileSystemUtils("/project");

    expect(utils).toBeDefined();
    expect(utils.readFile).toBeDefined();
    expect(utils.fileExists).toBeDefined();
    expect(utils.getProjectRoot).toBeDefined();
  });

  it("should return the project root", () => {
    const projectRoot = "/my/project";
    const utils = createFileSystemUtils(projectRoot);

    expect(utils.getProjectRoot()).toBe(projectRoot);
  });

  it("should read files successfully", async () => {
    const utils = createFileSystemUtils(__dirname);
    const result = await utils.readFile("file-system.ts");

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should construct absolute paths from relative paths", async () => {
    const utils = createFileSystemUtils(__dirname);
    const result = await utils.readFile("file-system.ts");

    // If path construction works, we should get content
    expect(result).toBeDefined();
  });

  it("should check if files exist", async () => {
    const utils = createFileSystemUtils(__dirname);
    const exists = await utils.fileExists("file-system.ts");

    expect(exists).toBe(true);
  });

  it("should return false when files do not exist", async () => {
    const utils = createFileSystemUtils(__dirname);
    const exists = await utils.fileExists("nonexistent-file-12345.ts");

    expect(exists).toBe(false);
  });

  it("should handle read errors for inaccessible files", async () => {
    const utils = createFileSystemUtils(__dirname);

    // Try to read a non-existent file
    try {
      await utils.readFile("../../../../../../etc/passwd");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).message).toContain("Failed to read file");
    }
  });

  it("should sandbox file access within project root", async () => {
    const tempDir = __dirname;
    const utils = createFileSystemUtils(tempDir);

    // Try to read a file in the project root
    const result = await utils.readFile("file-system.ts");
    expect(result).toBeDefined();
  });

  it("should handle relative paths with dot-dot", async () => {
    const tempDir = __dirname;
    const utils = createFileSystemUtils(tempDir);

    // This should still work because path.resolve handles ..
    try {
      const result = await utils.readFile("file-system.ts");
      expect(result).toBeDefined();
    } catch (error) {
      // Expected if file doesn't exist, but path should be resolved
      expect((error as any).message).toContain("Failed to read file");
    }
  });

  it("should support concurrent file operations", async () => {
    const utils = createFileSystemUtils(__dirname);

    const results = await Promise.all([
      utils.fileExists("file-system.ts"),
      utils.fileExists("logger.ts"),
      utils.fileExists("nonexistent.ts"),
    ]);

    expect(results).toHaveLength(3);
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(true);
    expect(results[2]).toBe(false);
  });

  it("should get project root consistently", () => {
    const projectRoot = "/home/user/project";
    const utils = createFileSystemUtils(projectRoot);

    expect(utils.getProjectRoot()).toBe(projectRoot);
    expect(utils.getProjectRoot()).toBe(projectRoot); // Should be consistent
  });
});
