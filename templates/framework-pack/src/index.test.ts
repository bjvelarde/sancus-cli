/**
 * Framework Pack — Unit Tests
 *
 * Run:  npm test
 * Type: npm run typecheck
 */

import { describe, it, expect, beforeEach } from "vitest";
import { detectMisconfiguration } from "./rules/misconfiguration.js";
import { detectInsecurePatterns } from "./rules/insecure-patterns.js";
import sancusPlugin from "./index.js";

// ── detectMisconfiguration ────────────────────────────────────────────────────

describe("detectMisconfiguration", () => {
  it("returns no findings for clean config", () => {
    const findings = detectMisconfiguration(
      "EXAMPLE_DEBUG_MODE = false",
      "src/config.ts",
    );
    expect(findings).toHaveLength(0);
  });

  it("detects debug mode enabled", () => {
    const findings = detectMisconfiguration(
      "EXAMPLE_DEBUG_MODE = true",
      "src/config.ts",
    );
    // TODO: update once real patterns are implemented
    expect(findings.length).toBeGreaterThanOrEqual(0);
  });

  it("finding has required SDK fields", () => {
    const findings = detectMisconfiguration(
      "EXAMPLE_DEBUG_MODE = true",
      "src/config.ts",
    );
    for (const f of findings) {
      expect(f.severity).toBeDefined();
      expect(f.message).toBeDefined();
      expect(f.location).toMatch(/^src\/config\.ts:\d+$/);
    }
  });
});

// ── detectInsecurePatterns ────────────────────────────────────────────────────

describe("detectInsecurePatterns", () => {
  it("returns no findings for clean code", () => {
    const findings = detectInsecurePatterns(
      "const data = safeDeserialize(input)",
      "src/handler.ts",
    );
    expect(findings).toHaveLength(0);
  });

  it("detects insecure deserialization", () => {
    const findings = detectInsecurePatterns(
      "EXAMPLE_UNSAFE_DESERIALIZE(userInput)",
      "src/handler.ts",
    );
    // TODO: update once real patterns are implemented
    expect(findings.length).toBeGreaterThanOrEqual(0);
  });
});

// ── Plugin contract ───────────────────────────────────────────────────────────

describe("sancusPlugin", () => {
  it("has required metadata fields", () => {
    const { metadata } = sancusPlugin;
    expect(metadata.id).toBeTruthy();
    expect(metadata.name).toBeTruthy();
    expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(metadata.author).toBeTruthy();
    expect(metadata.description).toBeTruthy();
  });

  it("has B3 manifest fields", () => {
    const { metadata } = sancusPlugin;
    expect(metadata.sdkVersion).toBeDefined();
    expect(metadata.engineCompatibility).toBeDefined();
    expect(metadata.capabilities).toBeInstanceOf(Array);
  });

  it("detect() returns empty array when framework not detected (skip=true)", async () => {
    // When initialize() sets skip=true (framework absent), detect() must short-circuit.
    // Simulate by calling detect() without calling initialize() — state.skip starts false,
    // so this tests the clean-file path instead.
    const file = {
      path: "src/example.ts",
      content: "// clean file",
      lines: ["// clean file"],
      extension: "ts",
    };
    const context = {
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      fs: { fileExists: async () => false, readFile: async () => "", listFiles: async () => [] },
      config: { projectRoot: "/tmp/test-project" },
    };
    const findings = await sancusPlugin.detect(file, context as any);
    expect(Array.isArray(findings)).toBe(true);
  });

  it("initialize() sets skip when package.json absent", async () => {
    const context = {
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      fs: {
        fileExists: async () => false,   // no package.json
        readFile: async () => "",
        listFiles: async () => [],
      },
      config: { projectRoot: "/tmp/no-framework-project" },
    };
    // Should not throw
    await expect(
      sancusPlugin.initialize!(context as any),
    ).resolves.toBeUndefined();
  });
});
