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
  /** Short identifier for the rule that triggered (e.g. "NO_SQL_INJECTION") */
  ruleId: string;
  /** Human-readable title */
  title: string;
  /** Detailed description of the issue */
  description: string;
  /** Severity level */
  severity: Severity;
  /** Confidence level */
  confidence: Confidence;
  /**
   * Source location in "path:line:col" or "path:line" format.
   * Must be a simple string — no structured objects.
   */
  location: string;
  /** Optional suggested remediation */
  remediation?: string;
}
