/**
 * Rule: Insecure Usage Patterns
 *
 * Detects insecure API usage and anti-patterns specific to your framework.
 *
 * TODO: Replace examples with real patterns (e.g. missing auth middleware,
 * unsafe deserialization, unvalidated redirects, mass assignment).
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

// ── Insecure patterns ─────────────────────────────────────────────────────────
const INSECURE_PATTERNS: Array<{
  pattern: RegExp;
  ruleId: string;
  message: string;
  recommendation: string;
  severity: Finding["severity"];
  confidence: Finding["confidence"];
}> = [
  {
    // TODO: replace with a real insecure pattern
    pattern: /EXAMPLE_UNSAFE_DESERIALIZE\s*\(/gi,
    ruleId: "your-framework/unsafe-deserialization",
    message: "Unsafe deserialization of untrusted input",
    recommendation:
      "Use a safe deserialization method that validates input schema before processing.",
    severity: "critical",
    confidence: "medium",
  },
  // TODO: add more patterns
];

export function detectInsecurePatterns(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  for (const { pattern, ruleId, message, recommendation, severity, confidence } of INSECURE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const line = lineNumber(content, match.index);
      findings.push({
        ruleId,
        severity,
        confidence,
        message,
        recommendation,
        location: `${filePath}:${line}`,
        lineRange: String(line),
        codeSnippet: snippet(content, line),
        category: "Security",
        references: [
          // TODO: add relevant OWASP or CVE links
          "https://owasp.org/www-project-top-ten/",
        ],
      });
    }
  }

  return findings;
}
