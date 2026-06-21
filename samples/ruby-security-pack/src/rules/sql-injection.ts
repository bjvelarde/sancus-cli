import type { Finding } from '@sancus/plugin-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the 1-based line number for a given character index within `content`.
 */
function lineNumber(content: string, matchIndex: number): number {
  return content.slice(0, matchIndex).split('\n').length;
}

/**
 * Return a short code snippet centred on `line` (1-based) with `ctx` lines of
 * context on each side, joined by newlines.
 */
function snippet(content: string, line: number, ctx = 2): string {
  const lines = content.split('\n');
  const start = Math.max(0, line - 1 - ctx);
  const end = Math.min(lines.length, line - 1 + ctx + 1);
  return lines.slice(start, end).join('\n');
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * Rule: ruby/sql-injection-where-interpolation
 *
 * Detects ActiveRecord .where() calls that use Ruby string interpolation
 * directly inside the SQL string, e.g.:
 *   User.where("name = '#{params[:name]}'")
 *
 * Safe alternative: User.where("name = ?", params[:name])
 *
 * Two sub-patterns handle double-quoted and single-quoted strings separately
 * so that the opposite quote character can appear freely inside the string
 * (e.g. a single-quote literal inside a double-quoted Ruby string).
 */
const WHERE_INTERPOLATION_DOUBLE_RE = /\.where\s*\(\s*"[^"]*#\{[^}]+\}[^"]*"/g;
const WHERE_INTERPOLATION_SINGLE_RE = /\.where\s*\(\s*'[^']*#\{[^}]+\}[^']*'/g;

/**
 * Rule: ruby/sql-injection-find-by-sql
 *
 * Detects find_by_sql calls where the SQL argument is built via string
 * concatenation (+), e.g.:
 *   User.find_by_sql("SELECT * FROM users WHERE id = " + user_id)
 */
const FIND_BY_SQL_CONCAT_RE = /\.find_by_sql\s*\(\s*["'][^"']*["']\s*\+/g;

/**
 * Rule: ruby/sql-injection-raw-execute
 *
 * Detects ActiveRecord::Base.connection.execute() calls that use Ruby string
 * interpolation directly in the SQL string, e.g.:
 *   ActiveRecord::Base.connection.execute("DELETE FROM logs WHERE id = #{id}")
 *
 * Same two-branch approach for double- vs. single-quoted strings.
 */
const RAW_EXECUTE_DOUBLE_RE = /\.execute\s*\(\s*"[^"]*#\{[^}]+\}[^"]*"/g;
const RAW_EXECUTE_SINGLE_RE = /\.execute\s*\(\s*'[^']*#\{[^}]+\}[^']*'/g;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Collect all match indices from a regex over `content`. */
function allMatchIndices(re: RegExp, content: string): number[] {
  const indices: number[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(content)) !== null) {
    indices.push(m.index);
  }
  return indices;
}

// ---------------------------------------------------------------------------
// Exported detector
// ---------------------------------------------------------------------------

export function detectSqlInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // --- where() with string interpolation ---
  const whereIndices = [
    ...allMatchIndices(WHERE_INTERPOLATION_DOUBLE_RE, content),
    ...allMatchIndices(WHERE_INTERPOLATION_SINGLE_RE, content),
  ].sort((a, b) => a - b);

  for (const idx of whereIndices) {
    const line = lineNumber(content, idx);
    findings.push({
      ruleId: 'ruby/sql-injection-where-interpolation',
      severity: 'critical',
      confidence: 'high',
      category: 'Security',
      title: 'SQL Injection via ActiveRecord where() string interpolation',
      message:
        'ActiveRecord .where() called with a string containing Ruby interpolation. ' +
        'User-controlled data embedded directly in SQL allows an attacker to alter ' +
        'query logic or exfiltrate arbitrary data.',
      recommendation:
        'Use parameterized queries: User.where("column = ?", user_input) ' +
        'or User.where(column: user_input).',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/attacks/SQL_Injection',
        'https://guides.rubyonrails.org/security.html#sql-injection',
      ],
    });
  }

  // --- find_by_sql with string concatenation ---
  const findBySqlIndices = allMatchIndices(FIND_BY_SQL_CONCAT_RE, content);
  for (const idx of findBySqlIndices) {
    const line = lineNumber(content, idx);
    findings.push({
      ruleId: 'ruby/sql-injection-find-by-sql',
      severity: 'critical',
      confidence: 'high',
      category: 'Security',
      title: 'SQL Injection via find_by_sql string concatenation',
      message:
        'find_by_sql called with a SQL string built by concatenation. ' +
        'Concatenating user input into SQL enables full SQL injection.',
      recommendation:
        'Pass an array with bind parameters: ' +
        'Model.find_by_sql(["SELECT * FROM users WHERE id = ?", id])',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/attacks/SQL_Injection',
        'https://api.rubyonrails.org/classes/ActiveRecord/Base.html#method-c-find_by_sql',
      ],
    });
  }

  // --- execute() with string interpolation ---
  const executeIndices = [
    ...allMatchIndices(RAW_EXECUTE_DOUBLE_RE, content),
    ...allMatchIndices(RAW_EXECUTE_SINGLE_RE, content),
  ].sort((a, b) => a - b);

  for (const idx of executeIndices) {
    const line = lineNumber(content, idx);
    findings.push({
      ruleId: 'ruby/sql-injection-raw-execute',
      severity: 'critical',
      confidence: 'high',
      category: 'Security',
      title: 'SQL Injection via raw connection.execute() with string interpolation',
      message:
        'ActiveRecord connection.execute() called with a SQL string that uses ' +
        'Ruby interpolation. Raw execute bypasses all ActiveRecord query safety ' +
        'mechanisms and is highly dangerous with user input.',
      recommendation:
        'Use ActiveRecord query methods with bind parameters, or pass a ' +
        'sanitized Arel node. Avoid raw execute with user-controlled data.',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/attacks/SQL_Injection',
        'https://guides.rubyonrails.org/security.html#sql-injection',
      ],
    });
  }

  return findings;
}
