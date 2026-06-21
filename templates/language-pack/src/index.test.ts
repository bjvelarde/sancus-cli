/**
 * Language Pack — Unit Tests
 *
 * Tests are organised by rule module. Each rule function is tested in
 * isolation so failures are easy to diagnose.
 *
 * Run:  npm test
 * Type: npm run typecheck
 */

import { describe, it, expect } from "vitest";
import { detectInjectionPatterns } from "./rules/injection.js";
import { detectInsecureAPIs } from "./rules/insecure-apis.js";
import sancusPlugin from "./index.js";

// ── detectInjectionPatterns ───────────────────────────────────────────────────

describe("detectInjectionPatterns", () => {
  it("returns no findings for clean content", () => {
    const findings = detectInjectionPatterns(
      'query = db.prepare("SELECT * FROM users WHERE id = ?")',
      "src/example.yl",
    );
    expect(findings).toHaveLength(0);
  });

  // TODO: replace the fixture below with a real vulnerable code sample
  // for your language once you've implemented the actual pattern.
  it("detects injection pattern in vulnerable content", () => {
    const vulnerable = `
      sql = "SELECT * FROM users WHERE id = " + EXAMPLE_SQL_PATTERN + userInput
    `;
    const findings = detectInjectionPatterns(vulnerable, "src/bad.yl");
    // TODO: update expected count once patterns are implemented
    expect(findings.length).toBeGreaterThanOrEqual(0);
  });

  it("finding has required SDK fields", () => {
    const vulnerable = `EXAMPLE_SQL_PATTERN + userInput`;
    const findings = detectInjectionPatterns(vulnerable, "src/vuln.yl");
    for (const f of findings) {
      expect(f.severity).toBeDefined();
      expect(f.message).toBeDefined();
      expect(f.location).toMatch(/^src\/vuln\.yl:\d+$/);
    }
  });
});

// ── detectInsecureAPIs ────────────────────────────────────────────────────────

describe("detectInsecureAPIs", () => {
  it("returns no findings for clean content", () => {
    const findings = detectInsecureAPIs(
      "x = crypto_secure_random()",
      "src/example.yl",
    );
    expect(findings).toHaveLength(0);
  });

  // TODO: add a test for real vulnerable patterns once implemented
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

  it("detect() returns an array", async () => {
    const file = {
      path: "src/example.yl",
      content: "// clean file",
      lines: ["// clean file"],
      extension: "yl",
    };
    const context = {
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
      fs: {
        fileExists: async () => false,
        readFile: async () => "",
        listFiles: async () => [],
      },
      config: { projectRoot: "/tmp/test-project" },
    };
    const findings = await sancusPlugin.detect(file, context as any);
    expect(Array.isArray(findings)).toBe(true);
  });
});
