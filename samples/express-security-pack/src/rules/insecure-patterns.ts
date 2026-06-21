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
 * Rule: express/open-redirect
 *
 * Detects `res.redirect(req.query.*)`, `res.redirect(req.params.*)`, or
 * `res.redirect(req.body.*)` — user-controlled input passed directly to the
 * redirect target, enabling open-redirect attacks.
 *
 * Severity : high
 * Confidence: high
 */
function detectOpenRedirect(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const pattern = /res\.redirect\s*\(\s*req\.(query|params|body)\b/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    const source = match[1]; // 'query' | 'params' | 'body'
    findings.push({
      ruleId: 'express/open-redirect',
      type: 'insecure-pattern',
      title: 'Open redirect via user-controlled input',
      message:
        "User-controlled input passed to res.redirect() — open redirect vulnerability",
      description:
        `req.${source} data is passed directly to res.redirect() without validation. ` +
        "An attacker can craft a link that redirects victims to a malicious external site, " +
        "enabling phishing and credential-theft attacks.",
      recommendation:
        "Validate and allowlist redirect targets before passing them to res.redirect(). " +
        "Consider using a map of safe named destinations rather than accepting raw URLs.",
      severity: 'high',
      confidence: 'high',
      category: 'injection',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
        'https://cwe.mitre.org/data/definitions/601.html',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/server-side-template-injection
 *
 * Detects `res.render(req.*)` — user-controlled input used as the template
 * name, which can lead to server-side template injection (SSTI) and remote
 * code execution.
 *
 * Severity : critical
 * Confidence: high
 */
function detectSSTemplateInjection(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];
  const pattern = /res\.render\s*\(\s*req\.(query|params|body)\b/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    const source = match[1];
    findings.push({
      ruleId: 'express/server-side-template-injection',
      type: 'insecure-pattern',
      title: 'Server-side template injection via user-controlled template name',
      message:
        "User-controlled input used as template name in res.render() — potential SSTI",
      description:
        `req.${source} data is passed as the first argument to res.render(). ` +
        "If an attacker can control the template name they may be able to load arbitrary " +
        "template files or inject template syntax, potentially achieving remote code execution " +
        "depending on the templating engine in use.",
      recommendation:
        "Never pass user-controlled input directly as a template name. " +
        "Use a static allowlist of valid template names and map request parameters to that list.",
      severity: 'critical',
      confidence: 'high',
      category: 'injection',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/07-Input_Validation_Testing/18-Testing_for_Server_Side_Template_Injection',
        'https://cwe.mitre.org/data/definitions/94.html',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/eval-user-input
 *
 * Detects `eval(req.*)` — passing request data to eval(), which allows
 * remote code execution.
 *
 * Severity : critical
 * Confidence: high
 */
function detectEvalUserInput(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const pattern = /eval\s*\(\s*req\./g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/eval-user-input',
      type: 'insecure-pattern',
      title: 'eval() called with user-controlled request data',
      message:
        "eval() called with user-controlled request data — remote code execution risk",
      description:
        "Passing request data to eval() allows any client to execute arbitrary JavaScript " +
        "on the server. This is one of the most severe vulnerabilities possible — " +
        "a complete remote code execution (RCE) vector.",
      recommendation:
        "Never use eval() with user-supplied input. " +
        "If dynamic code execution is genuinely required, use a sandboxed VM (e.g. Node's vm module) " +
        "with strict resource limits, and validate input against a strict allowlist first.",
      severity: 'critical',
      confidence: 'high',
      category: 'injection',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://cwe.mitre.org/data/definitions/95.html',
        'https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html',
      ],
    });
  }

  return findings;
}

/**
 * Rule: express/command-injection
 *
 * Detects `exec(req.*)` or `exec(\`...\${req.`)` — user-controlled input
 * passed to child_process exec(), enabling OS command injection.
 *
 * Severity : critical
 * Confidence: high
 */
function detectCommandInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Pattern 1: exec(req.something)
  const directPattern = /exec\s*\(\s*req\./g;
  let match: RegExpExecArray | null;

  while ((match = directPattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'express/command-injection',
      type: 'insecure-pattern',
      title: 'Command injection via user-controlled exec() argument',
      message:
        "User-controlled input passed to exec() — command injection risk",
      description:
        "Request data is passed directly to exec(), allowing an attacker to inject arbitrary " +
        "OS commands that will execute with the privileges of the Node.js process. " +
        "This is a critical remote code execution vulnerability.",
      recommendation:
        "Avoid passing user input to exec() or any shell-invoking function. " +
        "Use execFile() with a fixed command and a strictly validated argument array. " +
        "Prefer safer alternatives such as child_process.execFile() or purpose-built libraries.",
      severity: 'critical',
      confidence: 'high',
      category: 'injection',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://cwe.mitre.org/data/definitions/78.html',
        'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
        'https://nodejs.org/api/child_process.html',
      ],
    });
  }

  // Pattern 2: exec(`...${req.`) — template literal interpolation
  // We use a regex that matches exec( followed by a backtick and eventually ${req.
  const templatePattern = /exec\s*\(\s*`[^`]*\$\{req\./g;

  while ((match = templatePattern.exec(content)) !== null) {
    const line = lineNumber(content, match.index);

    // Avoid duplicating a finding if the direct pattern already matched the
    // same line (edge case: exec(req.x) is also exec(`...` after concat).
    const alreadyReported = findings.some(
      (f) => f.lineRange === String(line) && f.ruleId === 'express/command-injection',
    );
    if (alreadyReported) continue;

    findings.push({
      ruleId: 'express/command-injection',
      type: 'insecure-pattern',
      title: 'Command injection via template-literal exec() argument',
      message:
        "User-controlled input passed to exec() — command injection risk",
      description:
        "Request data is interpolated into a template literal and passed to exec(), allowing " +
        "an attacker to inject arbitrary OS shell commands. This is a critical vulnerability.",
      recommendation:
        "Avoid constructing shell commands with user input. " +
        "Use execFile() with a fixed binary path and a pre-validated argument array.",
      severity: 'critical',
      confidence: 'high',
      category: 'injection',
      location: filePath,
      lineRange: String(line),
      codeSnippet: snippet(content, match.index),
      references: [
        'https://cwe.mitre.org/data/definitions/78.html',
        'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
        'https://nodejs.org/api/child_process.html',
      ],
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs all insecure-pattern detection rules against a single file's content.
 *
 * @param content  - Raw source text of the file.
 * @param filePath - Path to the file (used to populate Finding.location).
 * @returns        Array of findings (may be empty).
 */
export function detectInsecurePatterns(
  content: string,
  filePath: string,
): Finding[] {
  return [
    ...detectOpenRedirect(content, filePath),
    ...detectSSTemplateInjection(content, filePath),
    ...detectEvalUserInput(content, filePath),
    ...detectCommandInjection(content, filePath),
  ];
}
