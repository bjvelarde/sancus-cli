import {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

/**
 * Custom Report Plugin
 *
 * Demonstrates the postScan() hook for aggregating findings
 * across the project after all files have been scanned.
 *
 * This example plugin detects environment variable hardcoding
 * and uses postScan() to create a summary report.
 *
 * Usage:
 *   npx sancus scan . --plugins ./examples/custom-report-plugin/index.ts
 */
export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: "hardcoded-env-vars",
    name: "Hardcoded Environment Variables Detector",
    version: "1.0.0",
    author: "Sancus Team",
    description:
      "Detects hardcoded environment variables and produces a summary report",
    keywords: ["env-vars", "security", "configuration"],
  },

  files: ["**/*.{ts,tsx,js,jsx,py}"],

  // Detect hardcoded environment variable patterns
  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    const lines = file.lines;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for common hardcoded env var patterns
      const patterns = [
        /process\.env\.\w+\s*=\s*['"].*['"]/, // JavaScript/TypeScript
        /os\.environ\['?\w+'?\]\s*=\s*['"].*['"]/, // Python
        /REACT_APP_\w+\s*=\s*['"].*['"]/, // React environment variables
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          findings.push({
            type: "hardcoded-env-var",
            severity: "high",
            location: `${file.path}:${i + 1}`,
            lineRange: String(i + 1),
            codeSnippet: line.trim(),
            confidence: "high",
            message: "Hardcoded environment variable detected",
            recommendation:
              "Use .env files or environment-specific config, never hardcode secrets or sensitive values",
            category: "Security",
            cvssScore: 5.3,
          });
        }
      }
    }

    return findings;
  },

  // Aggregate findings and produce a summary report
  async postScan(
    findings: Finding[],
    context: PluginContext,
  ): Promise<Finding[]> {
    context.logger.info(`\n${"=".repeat(60)}`);
    context.logger.info("Environment Variables Summary Report");
    context.logger.info(`${"=".repeat(60)}\n`);

    // Group findings by file
    const findingsByFile = new Map<string, Finding[]>();
    for (const finding of findings) {
      if (!findingsByFile.has(finding.location.split(":")[0])) {
        findingsByFile.set(finding.location.split(":")[0], []);
      }
      findingsByFile.get(finding.location.split(":")[0])!.push(finding);
    }

    // Print summary
    context.logger.info(
      `Total hardcoded environment variables found: ${findings.length}`,
    );
    context.logger.info(`Files affected: ${findingsByFile.size}\n`);

    // List files with most issues
    const sortedFiles = Array.from(findingsByFile.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    if (sortedFiles.length > 0) {
      context.logger.info("Top files with hardcoded env vars:");
      for (const [file, fileFindings] of sortedFiles) {
        context.logger.info(
          `  📄 ${file} (${fileFindings.length} issue${fileFindings.length === 1 ? "" : "s"})`,
        );
      }
    }

    context.logger.info(`\n${"=".repeat(60)}\n`);

    return findings;
  },
};

export default sancusPlugin;
