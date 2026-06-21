import type { Finding } from '@sancus/plugin-sdk';

// ---------------------------------------------------------------------------
// Minimal SARIF 2.1.0 types (inline — no external dependency)
// Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/
// ---------------------------------------------------------------------------

export interface SarifLog {
  version: '2.1.0';
  $schema: string;
  runs: SarifRun[];
}

export interface SarifRun {
  tool: SarifTool;
  results: SarifResult[];
  artifacts?: SarifArtifact[];
}

export interface SarifTool {
  driver: SarifDriver;
}

export interface SarifDriver {
  name: string;
  version: string;
  informationUri: string;
  rules: SarifRule[];
}

export interface SarifRule {
  id: string;
  name?: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  helpUri?: string;
  properties?: {
    tags?: string[];
    'security-severity'?: string;
  };
}

export interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note' | 'none';
  message: { text: string };
  locations?: SarifLocation[];
  partialFingerprints?: Record<string, string>;
}

export interface SarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string; uriBaseId?: string };
    region?: { startLine: number; endLine?: number };
  };
}

export interface SarifArtifact {
  location: { uri: string; uriBaseId?: string };
}

// ---------------------------------------------------------------------------
// ReportContext / ReportOutput — template-compatible shape
// ---------------------------------------------------------------------------

export interface ReportContext {
  projectRoot: string;
  generatedAt: string;
}

export type ReportOutput = SarifLog;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Sancus severity string to a SARIF result level.
 *
 * critical → error
 * high     → error
 * medium   → warning
 * low      → warning
 * info     → note
 */
export function severityToLevel(severity: string): SarifResult['level'] {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
    case 'low':
      return 'warning';
    case 'info':
      return 'note';
    default:
      return 'none';
  }
}

/**
 * Converts a rule id (e.g. "ruby/sql-injection") into a camelCase name
 * suitable for the SARIF `rule.name` field
 * (e.g. "RubySqlInjection").
 */
function toCamelCase(id: string): string {
  return id
    .split(/[\/\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Parses a Sancus location string into its URI and line components.
 *
 * Accepted formats:
 *   "path/file.ts:123"        → { uri: 'path/file.ts', startLine: 123 }
 *   "path/file.ts:123-125"    → { uri: 'path/file.ts', startLine: 123, endLine: 125 }
 *   undefined                 → { uri: 'unknown', startLine: 1 }
 */
export function parseLocation(
  location: string | undefined,
): { uri: string; startLine: number; endLine?: number } {
  if (!location) {
    return { uri: 'unknown', startLine: 1 };
  }

  // Split on the LAST colon to support Windows-style drive letters, e.g. C:\path\file.ts:10
  const lastColon = location.lastIndexOf(':');
  if (lastColon === -1) {
    return { uri: location, startLine: 1 };
  }

  const uri = location.slice(0, lastColon);
  const linesPart = location.slice(lastColon + 1);

  if (linesPart.includes('-')) {
    const [startStr, endStr] = linesPart.split('-');
    const startLine = parseInt(startStr ?? '1', 10);
    const endLine = parseInt(endStr ?? startStr ?? '1', 10);
    return { uri, startLine: isNaN(startLine) ? 1 : startLine, endLine: isNaN(endLine) ? undefined : endLine };
  }

  const startLine = parseInt(linesPart, 10);
  return { uri, startLine: isNaN(startLine) ? 1 : startLine };
}

/**
 * Converts a single Finding into a SarifRule descriptor.
 */
export function findingToRule(finding: Finding): SarifRule {
  const id = finding.ruleId ?? finding.type ?? 'unknown';
  const shortText = finding.title ?? finding.message;
  const truncated = shortText.length > 100 ? shortText.slice(0, 100) : shortText;

  const rule: SarifRule = {
    id,
    name: toCamelCase(id),
    shortDescription: { text: truncated },
  };

  if (finding.description) {
    rule.fullDescription = { text: finding.description };
  }

  if (finding.references && finding.references.length > 0) {
    rule.helpUri = finding.references[0];
  }

  return rule;
}

// ---------------------------------------------------------------------------
// Main formatter
// ---------------------------------------------------------------------------

const SARIF_SCHEMA =
  'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Documents/CommitteeSpecifications/2.1.0/sarif-schema-2.1.0.json';

/**
 * Converts an array of Sancus findings into a complete SARIF 2.1.0 log.
 *
 * @param findings    - Array of findings produced by Sancus detectors.
 * @param toolVersion - Semver string for the Sancus tool version.
 * @param projectRoot - Absolute path to the scanned project root; used to
 *                      strip path prefixes from location URIs.
 */
export function formatSarif(
  findings: Finding[],
  toolVersion: string,
  projectRoot: string,
): SarifLog {
  // Normalise projectRoot: ensure no trailing slash
  const normalizedRoot = projectRoot.endsWith('/')
    ? projectRoot.slice(0, -1)
    : projectRoot;

  // ------------------------------------------------------------------
  // 1. Build deduplicated rules map  (keyed by ruleId)
  // ------------------------------------------------------------------
  const rulesMap = new Map<string, SarifRule>();

  for (const finding of findings) {
    const rule = findingToRule(finding);
    if (!rulesMap.has(rule.id)) {
      rulesMap.set(rule.id, rule);
    }
  }

  // ------------------------------------------------------------------
  // 2. Build results array
  // ------------------------------------------------------------------
  const results: SarifResult[] = findings.map((finding) => {
    const ruleId = finding.ruleId ?? finding.type ?? 'unknown';
    const level = severityToLevel(finding.severity);
    const parsed = parseLocation(finding.location);

    // Strip projectRoot prefix from the URI so paths are relative
    let uri = parsed.uri;
    if (uri !== 'unknown' && uri.startsWith(normalizedRoot + '/')) {
      uri = uri.slice(normalizedRoot.length + 1);
    }

    const result: SarifResult = {
      ruleId,
      level,
      message: { text: finding.message },
    };

    // Only attach a location when we have a real file path
    if (parsed.uri !== 'unknown' || finding.location) {
      const region: { startLine: number; endLine?: number } = {
        startLine: parsed.startLine,
      };
      if (parsed.endLine !== undefined) {
        region.endLine = parsed.endLine;
      }

      result.locations = [
        {
          physicalLocation: {
            artifactLocation: {
              uri,
              uriBaseId: '%SRCROOT%',
            },
            region,
          },
        },
      ];
    }

    return result;
  });

  // ------------------------------------------------------------------
  // 3. Build artifacts array (unique URIs)
  // ------------------------------------------------------------------
  const artifactUris = new Set<string>();
  for (const result of results) {
    for (const loc of result.locations ?? []) {
      artifactUris.add(loc.physicalLocation.artifactLocation.uri);
    }
  }

  const artifacts: SarifArtifact[] = Array.from(artifactUris).map((uri) => ({
    location: { uri, uriBaseId: '%SRCROOT%' },
  }));

  // ------------------------------------------------------------------
  // 4. Assemble the log
  // ------------------------------------------------------------------
  const run: SarifRun = {
    tool: {
      driver: {
        name: 'Sancus',
        version: toolVersion,
        informationUri: 'https://github.com/sancus-security/sancus-cli',
        rules: Array.from(rulesMap.values()),
      },
    },
    results,
  };

  if (artifacts.length > 0) {
    run.artifacts = artifacts;
  }

  return {
    version: '2.1.0',
    $schema: SARIF_SCHEMA,
    runs: [run],
  };
}

// ---------------------------------------------------------------------------
// Convenience alias — matches the reporter template's formatReport signature
// ---------------------------------------------------------------------------

export function formatReport(
  findings: Finding[],
  context: ReportContext,
): ReportOutput {
  return formatSarif(findings, '1.0.0', context.projectRoot);
}
