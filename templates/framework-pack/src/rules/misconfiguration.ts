/**
 * Rule: Misconfiguration Detection
 *
 * Detects insecure framework configuration patterns.
 *
 * TODO: Replace the example with real misconfiguration patterns
 * for your framework (e.g. debug mode enabled, weak session config,
 * permissive CORS, disabled CSRF protection).
 */

import type { Finding } from "@sancus/plugin-sdk";

function lineNumber(content: string, matchIndex: number): number {
  return (content.substring(0, matchIndex).match(/\n/g) ?? []).length + 1;
}

function snippet(content: string, line: number, ctx = 2): string {
  const lines = content.split("\n");
  const start = Math.max(0, line - ctx - 1);
  const end = Math.min(lines.length, line + ctx);
  return lines.slice(start, end).join("\n");
}

// ── Misconfiguration patterns ─────────────────────────────────────────────────
// TODO: define real patterns for your framework.
const MISCONFIG_PATTERNS: Array<{
  pattern: RegExp;
  ruleId: string;
  message: string;
  recommendation: string;
  severity: Finding["severity"];
}> = [
  {
    // TODO: replace with a real misconfiguration pattern
    pattern: /EXAMPLE_DEBUG_MODE\s*=\s*true/gi,
    ruleId: "your-framework/debug-mode-enabled",
    message: "Framework debug mode is enabled — must be disabled in production",
    recommendation:
      "Set debug mode to false or use environment-based configuration.",
    severity: "high",
  },
  // TODO: add more patterns
];

export function detectMisconfiguration(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  for (const { pattern, ruleId, message, recommendation, severity } of MISCONFIG_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const line = lineNumber(content, match.index);
      findings.push({
        ruleId,
        severity,
        confidence: "high",
        message,
        recommendation,
        location: `${filePath}:${line}`,
        lineRange: String(line),
        codeSnippet: snippet(content, line),
        category: "Misconfiguration",
      });
    }
  }

  return findings;
}
