import {
  SancusPlugin,
  ScannedFile,
  PluginContext,
  Finding,
} from "@sancus/plugin-sdk";

interface PluginState {
  hasReact: boolean;
  hasNext: boolean;
  skipDetection: boolean;
}

/**
 * Framework Detector Plugin
 *
 * Demonstrates the initialize() hook for framework detection.
 *
 * This example plugin:
 * 1. Checks if React/Next.js is present in the project
 * 2. Only scans API route files if Next.js is detected
 * 3. Looks for unsafe server action patterns
 *
 * Usage:
 *   npx sancus scan . --plugins ./examples/framework-detector-plugin/index.ts
 */

// Plugin state persisted across files
const pluginState: PluginState = {
  hasReact: false,
  hasNext: false,
  skipDetection: false,
};

export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: "nextjs-server-actions",
    name: "Next.js Server Actions Security Detector",
    version: "1.0.0",
    author: "Sancus Team",
    description: "Detects unsafe patterns in Next.js Server Actions",
    keywords: ["nextjs", "react", "server-actions", "security"],
  },

  // Only scan files that look like Next.js API routes or server actions
  files: [
    "**/app/**/*.ts",
    "**/app/**/*.tsx",
    "**/pages/api/**/*.ts",
    "**/pages/api/**/*.tsx",
  ],

  // Initialize: Check if this is actually a Next.js project
  async initialize(context: PluginContext): Promise<void> {
    context.logger.info("Initializing Next.js Server Actions detector");

    // Check for Next.js indicators
    const hasPackageJson = await context.fs.fileExists("package.json");
    const hasNextConfig =
      (await context.fs.fileExists("next.config.js")) ||
      (await context.fs.fileExists("next.config.mjs"));

    if (hasPackageJson) {
      try {
        const packageJsonContent = await context.fs.readFile("package.json");
        const packageJson = JSON.parse(packageJsonContent);
        pluginState.hasNext = !!(
          packageJson.dependencies?.next || packageJson.devDependencies?.next
        );
        pluginState.hasReact = !!(
          packageJson.dependencies?.react || packageJson.devDependencies?.react
        );
      } catch (error) {
        context.logger.warn(
          "Could not parse package.json, skipping Next.js detection",
        );
        pluginState.skipDetection = true;
      }
    }

    if (hasNextConfig) {
      pluginState.hasNext = true;
    }

    if (!pluginState.hasNext) {
      context.logger.warn(
        "Next.js not detected in this project. Skipping Server Actions security checks.",
      );
      pluginState.skipDetection = true;
    } else {
      context.logger.info(
        "✓ Next.js detected. Running Server Actions security checks.",
      );
    }
  },

  // Detect unsafe patterns in Server Actions
  async detect(file: ScannedFile, context: PluginContext): Promise<Finding[]> {
    // Skip detection if Next.js was not found
    if (pluginState.skipDetection) {
      return [];
    }

    const findings: Finding[] = [];
    const lines = file.lines;
    const fileContent = file.content;

    // Check 1: 'use server' directive (indicates a Server Action)
    const hasUseServer =
      fileContent.includes("'use server'") ||
      fileContent.includes('"use server"');

    if (!hasUseServer) {
      return findings; // Not a Server Action, skip
    }

    // Check 2: Direct database queries without validation
    const unsafePatterns = [
      {
        pattern: /db\.query\s*\(\s*query\s*,\s*user/i,
        message: "User input passed directly to database query",
        type: "unsafe-db-query",
      },
      {
        pattern: /eval\s*\(/,
        message: "eval() detected in Server Action",
        type: "eval-in-server-action",
        severity: "critical" as const,
      },
      {
        pattern: /JSON\.parse\s*\(\s*(\w+)\s*\)/,
        message: "Unvalidated JSON parsing in Server Action",
        type: "unvalidated-json-parse",
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const {
        pattern,
        message,
        type,
        severity = "high" as const,
      } of unsafePatterns) {
        if (pattern.test(line)) {
          findings.push({
            type,
            severity,
            location: `${file.path}:${i + 1}`,
            lineRange: String(i + 1),
            codeSnippet: line.trim(),
            confidence: "medium",
            message: `Server Action Security: ${message}`,
            recommendation:
              "Validate and sanitize all user inputs before using them in Server Actions",
            category: "Security",
            cvssScore: severity === "critical" ? 9.0 : 7.5,
          });
        }
      }
    }

    return findings;
  },
};

export default sancusPlugin;
