import type {
  SancusPlugin,
  PluginMetadata,
  PluginContext,
  ScannedFile,
  Finding,
} from '@sancus/plugin-sdk';

import { detectMisconfiguration } from './rules/misconfiguration.js';
import { detectInsecurePatterns } from './rules/insecure-patterns.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const metadata: PluginMetadata = {
  id: 'express-security-pack',
  name: '@sancus/sample-express-security-pack',
  version: '1.0.0',
  author: 'Sancus Team',
  description:
    'Sample Sancus framework pack: security detection for Express.js applications. ' +
    'Detects misconfigurations and insecure coding patterns in Express apps.',
  repository: 'https://github.com/sancus-security/sancus-cli',
  license: 'MIT',
  keywords: ['sancus', 'plugin', 'framework-pack', 'express', 'security'],
  sdkVersion: '1.0.0',
  engineCompatibility: '>=0.2.0',
  capabilities: ['filesystem'],
};

// ---------------------------------------------------------------------------
// Plugin implementation
// ---------------------------------------------------------------------------

/**
 * Reads and parses `package.json` from the project root.
 * Returns null if the file cannot be read or is not valid JSON.
 */
async function readProjectPackageJson(
  context: PluginContext,
): Promise<Record<string, unknown> | null> {
  try {
    const pkgPath = `${context.config.projectRoot}/package.json`;
    const raw = await context.fs.readFile(pkgPath);
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extracts the installed Express version from a parsed package.json object.
 * Checks both `dependencies` and `devDependencies`.
 */
function extractExpressVersion(
  pkg: Record<string, unknown>,
): string | null {
  const deps = (pkg['dependencies'] ?? {}) as Record<string, string>;
  const devDeps = (pkg['devDependencies'] ?? {}) as Record<string, string>;
  return deps['express'] ?? devDeps['express'] ?? null;
}

const plugin: SancusPlugin = {
  metadata,

  // Files to scan: all TypeScript and JavaScript files, everywhere.
  // The engine is responsible for applying ignore patterns (node_modules, dist, etc.).
  files: ['**/*.ts', '**/*.js'],

  // -------------------------------------------------------------------------
  // initialize()
  //
  // Called once before any files are scanned. Checks whether the project
  // actually uses Express — if not, sets state.skip = true so that detect()
  // is a no-op.
  // -------------------------------------------------------------------------
  async initialize(context: PluginContext): Promise<void> {
    const pkg = await readProjectPackageJson(context);

    if (pkg === null) {
      context.logger.warn(
        '[express-security-pack] Could not read package.json — skipping Express detection.',
      );
      state.skip = true;
      return;
    }

    const version = extractExpressVersion(pkg);

    if (version === null) {
      context.logger.warn(
        '[express-security-pack] Express not found in package.json dependencies — skipping.',
      );
      state.skip = true;
      return;
    }

    state.frameworkDetected = true;
    state.frameworkVersion = version;
    state.skip = false;

    context.logger.info(
      `[express-security-pack] Express ${version} detected — running security checks.`,
    );
  },

  // -------------------------------------------------------------------------
  // detect()
  //
  // Called for every file that matches `files`. Runs both rule modules and
  // returns the combined findings.
  // -------------------------------------------------------------------------
  async detect(file: ScannedFile, _context: PluginContext): Promise<Finding[]> {
    if (state.skip) {
      return [];
    }

    const misconfigFindings = detectMisconfiguration(file.content, file.path);
    const insecurePatternFindings = detectInsecurePatterns(
      file.content,
      file.path,
    );

    return [...misconfigFindings, ...insecurePatternFindings];
  },

  // -------------------------------------------------------------------------
  // postScan()
  //
  // Called once after all files have been scanned. Logs a summary when
  // findings are present.
  // -------------------------------------------------------------------------
  async postScan(
    findings: Finding[],
    context: PluginContext,
  ): Promise<Finding[]> {
    if (!state.frameworkDetected) {
      return findings;
    }

    if (findings.length === 0) {
      context.logger.info(
        '[express-security-pack] Scan complete — no security issues found.',
      );
      return findings;
    }

    // Build a simple severity breakdown for the log summary.
    const counts: Record<string, number> = {};
    for (const finding of findings) {
      counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
    }

    const breakdown = Object.entries(counts)
      .sort(([a], [b]) => {
        const order = ['critical', 'high', 'medium', 'low', 'info'];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(([sev, count]) => `${count} ${sev}`)
      .join(', ');

    context.logger.warn(
      `[express-security-pack] Scan complete — ${findings.length} finding(s): ${breakdown}.`,
    );

    return findings;
  },
};

export default plugin;

// Named export so consumers can import individual helpers if needed.
export { detectMisconfiguration } from './rules/misconfiguration.js';
export { detectInsecurePatterns } from './rules/insecure-patterns.js';
