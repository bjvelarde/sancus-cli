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
 *
 * This is the minimal public contract — only fields a third-party plugin
 * author needs to populate.  The engine enriches findings internally after
 * detect() returns (adding tool attribution, workspace, CVSS, etc.).
 *
 * Engine-internal enrichment lives on CoreFinding in sancus-core.
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
   * Source location string (e.g. "src/app.ts:42" or "src/app.ts:42:8").
   * The engine may derive this from ScannedFile.path if omitted.
   */
  location?: string;

  /** Line range (e.g. "10" or "10-15") */
  lineRange?: string;

  /** Relevant source code snippet for display in reports */
  codeSnippet?: string;

  // ── Categorization ───────────────────────────────────────────────────────

  /** Security category label (e.g. "Security", "Performance") */
  category?: string;

  /** CVE identifier if applicable */
  cve?: string | null;

  /** Related references (URLs) */
  references?: string[];

  /** Extension bag for plugin-specific data */
  metadata?: Record<string, unknown>;
}
