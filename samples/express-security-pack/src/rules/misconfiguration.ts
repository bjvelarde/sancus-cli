import type { Finding } from '@sancus/plugin-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the 1-based line number of the first character of `match` within
 * `content`.
 */
function lineNumber(content: string, matchIndex: number): number {
  return content.slice(0, matchIndex).split('\n').length;
}

/**
 * Returns the source line (trimmed) that contains the given match index.
 */
function snippet(content: string, matchIndex: number): string {
  const lines = content.split('\n');
  const line = lineNumber(content, matchIndex) - 1; // convert to 0-based
  return (lines[line] ?? '').trim();
}

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

/**
 * Rule: express/x-powered-by-enabled
 *
 * Detects `app.set('x-powered-by', true)` — explicitly re-enabling the
 * X-Powered-By response header, which reveals framework identity.
 *
 * Severity : low
 * Confidence: high
 */
function detectXPoweredBy(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  // Match both single and double quote variants
  const pattern = /app\.set\s*\(\s*['"]x-powered-by['"]\s*,\s*true\s*\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/x-powered-by-enabled',
      type: 'misconfiguration',
      title: 'X-Powered-By header explicitly enabled',
      message:
        "Express X-Powered-By header explicitly enabled — reveals framework identity to attackers",
      description:
        'The X-Powered-By response header discloses which server framework is in use. ' +
        'Attackers can use this information to target known vulnerabilities. ' +
        'Express disables this header by default; calling app.set(\'x-powered-by\', true) re-enables it.',
      recommendation:
        "Remove app.set('x-powered-by', true). " +
        "To be explicit, use app.disable('x-powered-by') or rely on the Express default.",
      severity: 'low',
      confidence: 'high',
      category: 'misconfiguration',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://expressjs.com/en/advanced/best-practice-security.html',
        'https://owasp.org/www-project-secure-headers/',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/cors-wildcard-origin
 *
 * Detects `origin: '*'` inside any JS/TS file, which is the most common
 * unsafe CORS configuration in Express apps.
 *
 * Severity : medium
 * Confidence: medium
 */
function detectCorsWildcard(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  // Match origin: '*' or origin: "*"
  const pattern = /origin\s*:\s*['"]\*['"]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/cors-wildcard-origin',
      type: 'misconfiguration',
      title: 'CORS wildcard origin',
      message:
        "CORS wildcard origin ('*') allows any domain to make cross-origin requests",
      description:
        "Setting cors({ origin: '*' }) permits any website to send cross-origin requests to this " +
        "server. When combined with credentials: true this becomes a critical vulnerability; " +
        "even without credentials it may expose sensitive APIs to unauthorised callers.",
      recommendation:
        "Restrict the CORS origin to a known allowlist, e.g. origin: ['https://app.example.com']. " +
        "Never combine origin: '*' with credentials: true.",
      severity: 'medium',
      confidence: 'medium',
      category: 'misconfiguration',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
        'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny',
        'https://expressjs.com/en/resources/middleware/cors.html',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/json-body-no-limit
 *
 * Detects `express.json()` called without any options object, meaning no
 * request body size limit is configured. This may allow large payloads to
 * cause denial-of-service conditions.
 *
 * Severity : info
 * Confidence: high
 */
function detectJsonBodyNoLimit(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  // Match express.json() with no arguments — must NOT be followed by '{'
  const pattern = /express\.json\s*\(\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/json-body-no-limit',
      type: 'misconfiguration',
      title: 'express.json() missing body size limit',
      message:
        "express.json() used without a size limit — large payloads may cause DoS",
      description:
        "Without a body size limit, a client can send arbitrarily large JSON payloads, " +
        "potentially exhausting server memory or CPU and causing a denial-of-service condition.",
      recommendation:
        "Pass a limit option appropriate for your use-case, " +
        "e.g. app.use(express.json({ limit: '100kb' })).",
      severity: 'info',
      confidence: 'high',
      category: 'misconfiguration',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://expressjs.com/en/4x/api.html#express.json',
        'https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/hardcoded-cookie-secret
 *
 * Detects `cookieParser('...')` with a hardcoded string literal as the
 * signing secret. Hardcoded secrets are committed to source control and
 * trivially extracted by attackers with repository access.
 *
 * Severity : high
 * Confidence: high
 */
function detectHardcodedCookieSecret(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];
  // Match cookieParser('...') or cookieParser("...")
  const pattern = /cookieParser\s*\(\s*(['"])[^'"]+\1/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/hardcoded-cookie-secret',
      type: 'misconfiguration',
      title: 'Hardcoded cookie-parser secret',
      message:
        "Hardcoded secret passed to cookieParser() — cookie signing key exposed in source code",
      description:
        "A hardcoded cookie secret is visible to anyone with access to the repository and " +
        "will be present in version-control history even after removal. An attacker who " +
        "obtains the secret can forge signed cookies.",
      recommendation:
        "Load the secret from an environment variable, e.g. cookieParser(process.env.COOKIE_SECRET). " +
        "Rotate the secret immediately if it has been committed.",
      severity: 'high',
      confidence: 'high',
      category: 'secrets',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://expressjs.com/en/resources/middleware/cookie-parser.html',
        'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
      ],
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs all misconfiguration detection rules against a single file's content.
 *
 * @param content  - Raw source text of the file.
 * @param filePath - Path to the file (used to populate Finding.location).
 * @returns        Array of findings (may be empty).
 */
export function detectMisconfiguration(
  content: string,
  filePath: string,
): Finding[] {
  return [
    ...detectXPoweredBy(content, filePath),
    ...detectCorsWildcard(content, filePath),
    ...detectJsonBodyNoLimit(content, filePath),
    ...detectHardcodedCookieSecret(content, filePath),
  ];
}
