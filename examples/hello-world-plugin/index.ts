import {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

/**
 * Hello World Plugin
 *
 * This is the simplest possible Sancus plugin.
 * It detects console.log() calls in TypeScript/JavaScript files.
 *
 * Usage:
 *   npx sancus scan . --plugins ./examples/hello-world-plugin/index.ts
 */
export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: "hello-world",
    name: "Hello World Plugin",
    version: "1.0.0",
    author: "Sancus Team",
    description: "Example plugin that detects console.log statements",
    keywords: ["example", "logging"],
  },

  // Only scan TypeScript and JavaScript files
  files: ["**/*.{ts,tsx,js,jsx}"],

  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Log that we're scanning this file
    context.logger.debug(`Scanning ${file.path} for console.log`);

    // Check each line for console.log
    const lines = file.lines;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("console.log")) {
        findings.push({
          type: "console-log-found",
          severity: "low",
          location: `${file.path}:${i + 1}`,
          lineRange: String(i + 1),
          codeSnippet: line.trim(),
          confidence: "high",
          message: "console.log statement found in code",
          recommendation:
            "Use a proper logging library (e.g., winston, pino) instead of console.log",
          category: "Best Practice",
        });
      }
    }

    if (findings.length > 0) {
      context.logger.info(
        `Found ${findings.length} console.log statements in ${file.path}`,
      );
    }

    return findings;
  },
};

export default sancusPlugin;
