/**
 * Reporter Extension — Unit Tests
 *
 * Run:  npm test
 * Type: npm run typecheck
 */

import { describe, it, expect } from "vitest";
import { formatReport } from "./formatter.js";
import sancusPlugin from "./index.js";
import type { Finding } from "@sancus/plugin-sdk";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const SAMPLE_FINDINGS: Finding[] = [
  {
    ruleId: "test/sql-injection",
    severity: "critical",
    confidence: "high",
    message: "SQL injection via user input",
    recommendation: "Use parameterized queries",
    location: "src/db.ts:42",
    lineRange: "42",
    category: "Security",
  },
  {
    ruleId: "test/console-log",
    severity: "low",
    confidence: "high",
    message: "console.log in production code",
    location: "src/app.ts:10",
    lineRange: "10",
    category: "Best Practice",
  },
];

const REPORT_CONTEXT = {
  projectRoot: "/tmp/test-project",
  generatedAt: "2026-01-01T00:00:00.000Z",
};

// ── formatReport ──────────────────────────────────────────────────────────────

describe("formatReport", () => {
  it("returns a non-empty string for non-empty findings", () => {
    const output = formatReport(SAMPLE_FINDINGS, REPORT_CONTEXT);
    expect(typeof output).toBe("string");
    expect((output as string).length).toBeGreaterThan(0);
  });

  it("handles empty findings gracefully", () => {
    const output = formatReport([], REPORT_CONTEXT);
    expect(typeof output).toBe("string");
  });

  it("includes critical findings before low findings", () => {
    const output = formatReport(SAMPLE_FINDINGS, REPORT_CONTEXT) as string;
    const criticalPos = output.indexOf("critical");
    const lowPos = output.indexOf("low");
    // Critical should appear before low in sorted output
    if (criticalPos !== -1 && lowPos !== -1) {
      expect(criticalPos).toBeLessThan(lowPos);
    }
  });

  it("includes project root in output", () => {
    const output = formatReport([], REPORT_CONTEXT) as string;
    expect(output).toContain(REPORT_CONTEXT.projectRoot);
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

  it("detect() always returns empty array (reporters must not produce findings)", async () => {
    const file = {
      path: "src/any.ts",
      content: "any content including EXAMPLE_SQL_PATTERN + userInput",
      lines: ["any content"],
      extension: "ts",
    };
    const context = {
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      fs: { fileExists: async () => false, readFile: async () => "", listFiles: async () => [] },
      config: { projectRoot: "/tmp/test-project" },
    };
    const findings = await sancusPlugin.detect(file, context as any);
    expect(findings).toHaveLength(0);
  });

  it("postScan() returns the same findings it received (reporters must not mutate)", async () => {
    const context = {
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      fs: { fileExists: async () => false, readFile: async () => "", listFiles: async () => [] },
      config: { projectRoot: "/tmp/test-project" },
    };
    const result = await sancusPlugin.postScan!(
      SAMPLE_FINDINGS,
      context as any,
    );
    expect(result).toEqual(SAMPLE_FINDINGS);
    expect(result).toHaveLength(SAMPLE_FINDINGS.length);
  });
});
