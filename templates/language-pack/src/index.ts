/**
 * Language Pack Template
 *
 * A language pack adds security detection for a new programming language.
 * It targets files by extension and scans their content for vulnerabilities.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every "TODO" and "<YourLanguage>" with your language name.
 * 2. Update `files` to match your language's file extensions.
 * 3. Add your detection rules in src/rules/ (one file per rule category).
 * 4. Export each rule function from src/rules/index.ts.
 * 5. Call your rules from detect() and collect findings.
 * 6. Update package.json: name, description, author, keywords.
 * 7. Run: npm install && npm test && npm run build
 */

import type {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

// Import your rule modules — add more as you implement them
import { detectInjectionPatterns } from "./rules/injection.js";
import { detectInsecureAPIs } from "./rules/insecure-apis.js";

export const sancusPlugin: SancusPlugin = {
  metadata: {
    // ── Required ──────────────────────────────────────────────────────────
    id: "your-language-security",             // TODO: unique slug, URL-safe, hyphen-separated
    name: "@your-org/sancus-plugin-your-language", // TODO: match package.json name
    version: "0.1.0",
    author: "TODO: Your Name or Org",
    description: "TODO: Security detector for <YourLanguage> codebases",

    // ── Discovery (shown in marketplace) ──────────────────────────────────
    keywords: ["your-language", "security"], // TODO: add language-specific keywords
    license: "MIT",
    repository: "https://github.com/your-org/sancus-plugin-your-language",
    severityHint: "high",

    // ── Compatibility (B3 manifest fields) ────────────────────────────────
    // Tell the engine which SDK and engine versions this plugin requires.
    sdkVersion: "1.0.0",
    engineCompatibility: ">=0.2.0",
    capabilities: ["filesystem"],
  },

  // ── File targeting ───────────────────────────────────────────────────────
  // Glob patterns for files this plugin should receive.
  // TODO: replace with your language's extensions.
  files: [
    "**/*.yourlang",    // TODO: e.g. "**/*.rb" for Ruby, "**/*.go" for Go
    "**/*.yl",          // TODO: additional extensions if applicable
  ],

  // ── initialize (optional) ────────────────────────────────────────────────
  // Called once before scanning starts. Use to detect language runtime,
  // read config files, or skip scanning entirely if prerequisites are absent.
  async initialize(context: PluginContext): Promise<void> {
    context.logger.debug("Initializing <YourLanguage> language pack");

    // TODO: (optional) check that the target project actually uses this language
    // Example:
    //   const hasLockFile = await context.fs.fileExists("Gemfile.lock");
    //   if (!hasLockFile) {
    //     context.logger.warn("No Gemfile.lock found — skipping Ruby checks");
    //   }
  },

  // ── detect ───────────────────────────────────────────────────────────────
  // Called once per matching file. Return an array of findings (empty = clean).
  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    context.logger.debug(`Scanning ${file.path}`);

    const findings: Finding[] = [];

    // Delegate to rule modules — each returns Finding[].
    findings.push(...detectInjectionPatterns(file.content, file.path));
    findings.push(...detectInsecureAPIs(file.content, file.path));

    // TODO: add more rule calls here as you implement them.

    return findings;
  },

  // ── postScan (optional) ──────────────────────────────────────────────────
  // Called once after ALL files have been scanned.
  // Use for cross-file correlation, deduplication, or aggregate reporting.
  // Remove this hook entirely if you don't need it.
  async postScan(
    findings: Finding[],
    context: PluginContext,
  ): Promise<Finding[]> {
    if (findings.length > 0) {
      context.logger.info(
        `<YourLanguage> pack: ${findings.length} finding(s) across scanned files`,
      );
    }
    // TODO: add cross-file logic here, or remove this hook.
    return findings;
  },
};

export default sancusPlugin;
