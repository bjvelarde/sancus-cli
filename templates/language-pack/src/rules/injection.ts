/**
 * Rule: Injection Patterns
 *
 * Detects SQL injection, command injection, and similar patterns
 * in <YourLanguage> source files.
 *
 * TODO: Replace the example patterns with real ones for your language.
 */

import type { Finding } from "@sancus/plugin-sdk";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns 1-based line number for a match at `matchIndex` in `content`. */
function lineNumber(content: string, matchIndex: number): number {
  return (content.substring(0, matchIndex).match(/\n/g) ?? []).length + 1;
}

/** Returns ±`ctx` lines of context around `line` (1-based). */
function snippet(content: string, line: number, ctx = 2): string {
  const lines = content.split("\n");
  const start = Math.max(0, line - ctx - 1);
  const end = Math.min(lines.length, line + ctx);
  return lines.slice(start, end).join("\n");
}

// ── Rule implementation ───────────────────────────────────────────────────────

/**
 * TODO: Implement real detection patterns for your language.
 *
 * Each pattern should:
 *   1. Match a vulnerability pattern with a RegExp.
 *   2. Compute location = `${filePath}:${lineNumber}`.
 *   3. Return a Finding with severity, message, and recommendation.
 *
 * The example below detects a placeholder pattern — replace it.
 */
export function detectInjectionPatterns(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  // TODO: Replace this example pattern with a real one.
  // Example: detect raw SQL string construction in your language.
  const pattern =
    /EXAMPLE_SQL_PATTERN\s*\+\s*userInput/gi; // ← replace this

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: "your-language/sql-injection",
      severity: "critical",
      confidence: "high",
      message: "Potential SQL injection: user input concatenated into query",
      recommendation:
        "Use parameterized queries or a query builder instead of string concatenation.",
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      category: "Security",
      references: [
        "https://owasp.org/www-community/attacks/SQL_Injection",
      ],
    });
  }

  return findings;
}
