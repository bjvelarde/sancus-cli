/**
 * Report Formatter
 *
 * Converts a list of Sancus findings into your output format.
 *
 * TODO: Replace the placeholder ReportOutput type and formatReport()
 * implementation with your real format.
 *
 * Common formats to implement:
 *   - SARIF (Static Analysis Results Interchange Format) — for GitHub / VS Code
 *   - HTML — for human-readable web reports
 *   - CSV — for spreadsheet import
 *   - Slack Block Kit — for Slack notifications
 *   - JUnit XML — for CI/CD pipeline integration
 */

import type { Finding } from "@sancus/plugin-sdk";

// ── Report context ────────────────────────────────────────────────────────────

export interface ReportContext {
  /** Absolute path to the scanned project root */
  projectRoot: string;
  /** ISO 8601 timestamp of when the report was generated */
  generatedAt: string;
}

// ── Output type ───────────────────────────────────────────────────────────────
// TODO: Replace this with your actual output structure.
// Examples:
//   - string (for text/HTML/CSV output)
//   - SarifLog (for SARIF)
//   - object (for JSON)

export type ReportOutput = string; // TODO: replace with your format type

// ── Severity ordering ─────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function bySeverity(a: Finding, b: Finding): number {
  return (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5);
}

// ── formatReport ──────────────────────────────────────────────────────────────

/**
 * Converts findings into a formatted report string (or structured object).
 *
 * TODO: Replace the example plain-text implementation with your real format.
 */
export function formatReport(
  findings: Finding[],
  context: ReportContext,
): ReportOutput {
  const sorted = [...findings].sort(bySeverity);

  // ── Example: plain-text summary (replace with your format) ───────────────
  const lines: string[] = [
    `Sancus Security Report`,
    `Generated: ${context.generatedAt}`,
    `Project:   ${context.projectRoot}`,
    `Findings:  ${findings.length}`,
    "",
  ];

  if (sorted.length === 0) {
    lines.push("No findings. Clean scan.");
  } else {
    // Group by severity
    const bySev = new Map<string, Finding[]>();
    for (const f of sorted) {
      const bucket = bySev.get(f.severity) ?? [];
      bucket.push(f);
      bySev.set(f.severity, bucket);
    }

    for (const [sev, group] of bySev) {
      lines.push(`[${sev.toUpperCase()}] — ${group.length} finding(s)`);
      for (const f of group) {
        const loc = typeof f.location === "string" ? f.location : "unknown";
        lines.push(`  • ${loc}`);
        lines.push(`    ${f.message}`);
        if (f.recommendation) {
          lines.push(`    → ${f.recommendation}`);
        }
      }
      lines.push("");
    }
  }

  // TODO: replace the join below with your real serialisation logic
  return lines.join("\n");
}
