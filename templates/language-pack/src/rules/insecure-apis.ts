/**
 * Rule: Insecure API Usage
 *
 * Detects calls to known-insecure standard library APIs
 * in <YourLanguage> source files.
 *
 * TODO: Replace the example patterns with real ones for your language.
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

// ── Known insecure APIs ───────────────────────────────────────────────────────
// TODO: Populate with real insecure API names for your language.
const INSECURE_APIS: Array<{
  pattern: RegExp;
  ruleId: string;
  message: string;
  recommendation: string;
  severity: Finding["severity"];
}> = [
  {
    pattern: /EXAMPLE_INSECURE_FUNCTION\s*\(/gi, // TODO: replace
    ruleId: "your-language/insecure-random",
    message: "Use of cryptographically insecure random number generator",
    recommendation:
      "Use the cryptographically secure RNG provided by your language's standard library.",
    severity: "high",
  },
  // TODO: add more entries
];

export function detectInsecureAPIs(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  for (const api of INSECURE_APIS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(api.pattern.source, api.pattern.flags);
    while ((match = re.exec(content)) !== null) {
      const line = lineNumber(content, match.index);
      findings.push({
        ruleId: api.ruleId,
        severity: api.severity,
        confidence: "medium",
        message: api.message,
        recommendation: api.recommendation,
        location: `${filePath}:${line}`,
        lineRange: String(line),
        codeSnippet: snippet(content, line),
        category: "Security",
      });
    }
  }

  return findings;
}
