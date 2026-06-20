// Domain: finding
// Owned by: @sancus/plugin-sdk
// Consumers: external plugin authors (return type of detect())

/**
 * Severity levels for a finding.
 * Ordered from most to least severe.
 */
export type Severity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Confidence that a finding is a true positive.
 */
export type Confidence = "high" | "medium" | "low";

/**
 * A security finding produced by a plugin.
 * This is the SDK-facing type — engine enriches it internally.
 */
export interface Finding {
  // ── Core identification ─────────────────────────────────────────────────

  /**
   * Rule identifier (e.g. "NO_SQL_INJECTION").
   * Preferred over `type` for new plugins.
   */
  ruleId?: string;

  /**
   * Short type slug (e.g. "command-injection").
   * Legacy alias for ruleId — supported for backward compatibility.
   */
  type?: string;

  // ── Display ─────────────────────────────────────────────────────────────

  /** Human-readable title */
  title?: string;

  /** One-line summary of the finding (required in practice) */
  message: string;

  /** Detailed description of the issue */
  description?: string;

  /** Suggested remediation steps */
  recommendation?: string;

  // ── Classification ───────────────────────────────────────────────────────

  /** Severity level */
  severity: Severity;

  /** Confidence level */
  confidence?: Confidence;

  // ── Location ─────────────────────────────────────────────────────────────

  /**
   * Source location in "path:line:col" or "path:line" format.
   */
  location?: string;

  /**
   * Line range (e.g. "10" or "10-15").
   */
  lineRange?: string;

  /**
   * Relevant source code snippet for display in reports.
   */
  codeSnippet?: string;

  // ── Categorization ───────────────────────────────────────────────────────

  /** Security category label (e.g. "Security", "Performance") */
  category?: string;
  /** Monorepo workspace this finding belongs to (if applicable) */
  workspace?: string;

  /** CVSS score (0.0–10.0) */
  cvssScore?: number;

  /** Extension bag for plugin-specific or engine-internal data */
  metadata?: Record<string, unknown>;

  /** CVE identifier if applicable */
  cve?: string | null;

  /** Related references (URLs) */
  references?: string[];

  // ── Developer guidance ───────────────────────────────────────────────────

  /** Unique finding instance ID (engine may assign; plugins may hint) */
  id?: string;

  /** Estimated developer time to fix (e.g. "10min", "2h") */
  estimatedFixTime?: string;

  /** Whether applying the fix breaks backward compatibility */
  backwardsCompatible?: boolean;

  /** Human-readable migration guidance */
  migrationNote?: string;

  /** Associated test file path, if this finding has a test */
  testFile?: string | null;

  /** Versions where this issue was patched (for dependency findings) */
  patchedVersions?: string | string[];
}
