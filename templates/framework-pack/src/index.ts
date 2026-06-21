/**
 * Framework Pack Template
 *
 * A framework pack adds security detection for a specific framework or library.
 * It uses initialize() to confirm the framework is present, then applies
 * framework-specific rules to targeted files.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every "TODO" and "<YourFramework>" with your framework name.
 * 2. Update `files` to match the file patterns relevant to your framework.
 * 3. Implement framework detection in initialize() (package.json check, config
 *    file presence, etc.).
 * 4. Add your rules in src/rules/ — one file per concern area.
 * 5. Export each rule function from src/rules/index.ts.
 * 6. Update package.json: name, description, author, keywords.
 * 7. Run: npm install && npm test && npm run build
 */

import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

import { detectMisconfiguration } from "./rules/misconfiguration.js";
import { detectInsecurePatterns } from "./rules/insecure-patterns.js";

// ── Plugin state ──────────────────────────────────────────────────────────────
// State persists for the lifetime of a scan session (across all files).
// Keep it minimal — only what initialize() discovers.
interface PackState {
  frameworkDetected: boolean;
  frameworkVersion: string | null;
  skip: boolean;
}

const state: PackState = {
  frameworkDetected: false,
  frameworkVersion: null,
  skip: false,
};

// ── Plugin ────────────────────────────────────────────────────────────────────

export const sancusPlugin: SancusPlugin = {
  metadata: {
    // ── Required ──────────────────────────────────────────────────────────
    id: "your-framework-security",              // TODO: unique slug
    name: "@your-org/sancus-plugin-your-framework", // TODO: match package.json
    version: "0.1.0",
    author: "TODO: Your Name or Org",
    description:
      "TODO: Security detector for <YourFramework> applications",

    // ── Discovery ─────────────────────────────────────────────────────────
    keywords: ["your-framework", "security"],  // TODO
    license: "MIT",
    repository:
      "https://github.com/your-org/sancus-plugin-your-framework",
    severityHint: "high",

    // ── Compatibility (B3 manifest fields) ────────────────────────────────
    sdkVersion: "1.0.0",
    engineCompatibility: ">=0.2.0",
    capabilities: ["filesystem"],
  },

  // ── File targeting ───────────────────────────────────────────────────────
  // Scope to files that are relevant to your framework.
  // TODO: update patterns for your framework's conventions.
  files: [
    "**/src/**/*.{ts,tsx,js,jsx}",       // TODO: adjust to your framework
    "**/app/**/*.{ts,tsx,js,jsx}",
    "**/config/**/*.{ts,js,json}",
  ],

  // ── initialize ───────────────────────────────────────────────────────────
  // Confirm the framework is present before scanning any files.
  // If the project does not use this framework, set state.skip = true.
  async initialize(context: PluginContext): Promise<void> {
    context.logger.debug("Initializing <YourFramework> pack");

    // TODO: check for your framework's presence.
    // Common checks:
    //   - package.json dependency
    //   - framework config file
    //   - lock file entry

    const hasPackageJson = await context.fs.fileExists("package.json");
    if (!hasPackageJson) {
      context.logger.warn("No package.json found — skipping framework checks");
      state.skip = true;
      return;
    }

    try {
      const raw = await context.fs.readFile("package.json");
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      // TODO: replace "your-framework" with the real npm package name.
      const version =
        pkg.dependencies?.["your-framework"] ??
        pkg.devDependencies?.["your-framework"] ??
        null;

      if (!version) {
        context.logger.warn(
          "<YourFramework> not found in package.json — skipping checks",
        );
        state.skip = true;
        return;
      }

      state.frameworkDetected = true;
      state.frameworkVersion = version;
      context.logger.info(
        `<YourFramework> ${version} detected — running security checks`,
      );
    } catch {
      context.logger.warn("Could not parse package.json — skipping");
      state.skip = true;
    }
  },

  // ── detect ───────────────────────────────────────────────────────────────
  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    if (state.skip) return [];

    context.logger.debug(`Scanning ${file.path}`);

    const findings: Finding[] = [];

    findings.push(...detectMisconfiguration(file.content, file.path));
    findings.push(...detectInsecurePatterns(file.content, file.path));

    // TODO: add more rule calls here.

    return findings;
  },

  // ── postScan (optional) ──────────────────────────────────────────────────
  // Remove this hook if you don't need cross-file aggregation.
  async postScan(
    findings: Finding[],
    context: PluginContext,
  ): Promise<Finding[]> {
    if (state.frameworkDetected && findings.length > 0) {
      context.logger.info(
        `<YourFramework> pack: ${findings.length} finding(s) found`,
      );
    }
    // TODO: add cross-file logic, or remove this hook.
    return findings;
  },
};

export default sancusPlugin;
