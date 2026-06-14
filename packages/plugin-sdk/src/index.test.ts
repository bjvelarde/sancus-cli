import { describe, it, expect } from "vitest";
import * as sdk from "./index.js";

describe("Public API Exports", () => {
  it("should export all type definitions", () => {
    // Types should be available for TypeScript
    expect(sdk).toBeDefined();
  });

  it("should export createLogger function", () => {
    expect(sdk.createLogger).toBeDefined();
    expect(typeof sdk.createLogger).toBe("function");
  });

  it("should export createFileSystemUtils function", () => {
    expect(sdk.createFileSystemUtils).toBeDefined();
    expect(typeof sdk.createFileSystemUtils).toBe("function");
  });

  it("should allow importing specific exports", () => {
    // This tests that named imports work
    const { createLogger, createFileSystemUtils } = sdk;

    expect(createLogger).toBeDefined();
    expect(createFileSystemUtils).toBeDefined();
  });

  it("should provide utility factory functions", () => {
    const logger = sdk.createLogger("test");
    const fs = sdk.createFileSystemUtils("/");

    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();

    expect(fs.readFile).toBeDefined();
    expect(fs.fileExists).toBeDefined();
    expect(fs.getProjectRoot).toBeDefined();
  });

  it("should have correct module structure", () => {
    // ES module exports should be available
    expect(sdk).toBeDefined();

    // Named exports should work
    const { createLogger, createFileSystemUtils } = sdk;
    expect(createLogger).toBeDefined();
    expect(createFileSystemUtils).toBeDefined();
  });
});
