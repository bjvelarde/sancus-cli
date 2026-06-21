/**
 * Reporter Extension Template
 *
 * A reporter extension consumes scan findings via postScan() and renders
 * them in a custom output format (SARIF, HTML, Slack message, CSV, etc.).
 * It does NOT detect new vulnerabilities — detection is left to other plugins.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every "TODO" and "<YourFormat>" with your format name.
 * 2. Implement formatReport() in src/formatter.ts.
 * 3. Implement writeOutput() in src/output.ts (write to file, POST to API, etc.).
 * 4. Update package.json: name, description, author, keywords.
 * 5. Run: npm install && npm test && npm run build
 *
 * IMPORTANT: A reporter's detect() should always return [].
 * All work happens in postScan().
 */

import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

import { formatReport } from "./formatter.js";
import { writeOutput } from "./output.js";

export const sancusPlugin: SancusPlugin = {
  metadata: {
    // ── Required ──────────────────────────────────────────────────────────
    id: "reporter-your-format",                         // TODO: unique slug
    name: "@your-org/sancus-reporter-your-format",      // TODO: match package.json
    version: "0.1.0",
    author: "TODO: Your Name or Org",
    description: "TODO: Outputs Sancus findings as <YourFormat>",

    // ── Discovery ─────────────────────────────────────────────────────────
    keywords: ["sancus", "reporter", "your-format"],    // TODO
    license: "MIT",
    repository:
      "https://github.com/your-org/sancus-reporter-your-format",

    // ── Compatibility (B3 manifest fields) ────────────────────────────────
    sdkVersion: "1.0.0",
    engineCompatibility: ">=0.2.0",
    // Reporters typically don't need filesystem access beyond writing output,
    // but declare it if writeOutput() writes to disk.
    capabilities: ["filesystem"],
  },

  // ── File targeting ───────────────────────────────────────────────────────
  // Reporters receive all files so postScan() has access to the full picture.
  // Return [] from detect() — do NOT add findings here.
  files: ["**/*"],

  // ── detect ───────────────────────────────────────────────────────────────
  // Reporters MUST return an empty array from detect().
  // All reporting logic belongs in postScan().
  async detect(_file: ScannedFile, _context: PluginContext): Promise<Finding[]> {
    return [];
  },

  // ── postScan ─────────────────────────────────────────────────────────────
  // Called once after all files have been scanned, with the complete
  // finding list from ALL plugins that ran this session.
  async postScan(
    findings: Finding[],
    context: PluginContext,
  ): Promise<Finding[]> {
    context.logger.info(
      `<YourFormat> reporter: formatting ${findings.length} finding(s)`,
    );

    // 1. Format findings into your output format.
    const report = formatReport(findings, {
      projectRoot: context.config.projectRoot,
      generatedAt: new Date().toISOString(),
    });

    // 2. Write or send the formatted report.
    await writeOutput(report, context);

    // 3. Return the findings unchanged — reporters must not modify findings.
    return findings;
  },
};

export default sancusPlugin;
