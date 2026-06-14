import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createLogger } from "../utils/logger.js";

describe("createLogger", () => {
  let debugSpy: any;
  let infoSpy: any;
  let warnSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should create a logger with plugin name prefix", () => {
    const logger = createLogger("my-plugin");

    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("should log debug messages with plugin prefix", () => {
    const logger = createLogger("test-plugin");
    logger.debug("Test message");

    expect(debugSpy).toHaveBeenCalled();
    const calls = debugSpy.mock.calls[0];
    expect(calls[0]).toContain("test-plugin");
  });

  it("should log info messages with plugin prefix", () => {
    const logger = createLogger("test-plugin");
    logger.info("Test message");

    expect(infoSpy).toHaveBeenCalled();
    const calls = infoSpy.mock.calls[0];
    expect(calls[0]).toContain("test-plugin");
  });

  it("should log warn messages with plugin prefix", () => {
    const logger = createLogger("test-plugin");
    logger.warn("Test message");

    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls[0];
    expect(calls[0]).toContain("test-plugin");
  });

  it("should log error messages with plugin prefix", () => {
    const logger = createLogger("test-plugin");
    logger.error("Test message");

    expect(errorSpy).toHaveBeenCalled();
    const calls = errorSpy.mock.calls[0];
    expect(calls[0]).toContain("test-plugin");
  });

  it("should support logging with additional data", () => {
    const logger = createLogger("test-plugin");
    logger.info("Test message", { key: "value" });

    expect(infoSpy).toHaveBeenCalled();
    const calls = infoSpy.mock.calls[0];
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("should work with different plugin names", () => {
    const logger1 = createLogger("plugin-1");
    const logger2 = createLogger("plugin-2");

    logger1.info("Message 1");
    logger2.info("Message 2");

    expect(infoSpy).toHaveBeenCalledTimes(2);
  });
});
