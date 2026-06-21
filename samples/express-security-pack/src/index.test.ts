import { describe, it, expect } from 'vitest';
import { detectMisconfiguration } from './rules/misconfiguration.js';
import { detectInsecurePatterns } from './rules/insecure-patterns.js';

// =============================================================================
// detectMisconfiguration
// =============================================================================

describe('detectMisconfiguration', () => {
  // ---------------------------------------------------------------------------
  // express/x-powered-by-enabled
  // ---------------------------------------------------------------------------

  describe('express/x-powered-by-enabled', () => {
    it('detects app.set with x-powered-by true (single quotes)', () => {
      const content = `app.set('x-powered-by', true)`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/x-powered-by-enabled');
      expect(findings[0].severity).toBe('low');
    });

    it('detects app.set with x-powered-by true (double quotes)', () => {
      const content = `app.set("x-powered-by", true)`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/x-powered-by-enabled');
    });

    it('does not flag app.disable(x-powered-by)', () => {
      const content = `app.disable('x-powered-by')`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/x-powered-by-enabled',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/cors-wildcard-origin
  // ---------------------------------------------------------------------------

  describe('express/cors-wildcard-origin', () => {
    it('detects wildcard CORS origin', () => {
      const content = `app.use(cors({ origin: '*', methods: ['GET', 'POST'] }))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/cors-wildcard-origin');
    });

    it('detects wildcard CORS origin with double quotes', () => {
      const content = `cors({ origin: "*" })`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/cors-wildcard-origin');
      expect(findings[0].severity).toBe('medium');
    });

    it('does not flag explicit origin allowlist', () => {
      const content = `cors({ origin: ['https://app.example.com'] })`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/cors-wildcard-origin',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/json-body-no-limit
  // ---------------------------------------------------------------------------

  describe('express/json-body-no-limit', () => {
    it('detects express.json() without limit', () => {
      const content = `app.use(express.json())`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/json-body-no-limit');
    });

    it('does not flag express.json() with limit', () => {
      const content = `app.use(express.json({ limit: '10kb' }))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const limitFindings = findings.filter(
        (f) => f.ruleId === 'express/json-body-no-limit',
      );
      expect(limitFindings).toHaveLength(0);
    });

    it('does not flag express.json({ extended: true }) (has options object)', () => {
      const content = `app.use(express.json({ extended: true }))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const limitFindings = findings.filter(
        (f) => f.ruleId === 'express/json-body-no-limit',
      );
      expect(limitFindings).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/hardcoded-cookie-secret
  // ---------------------------------------------------------------------------

  describe('express/hardcoded-cookie-secret', () => {
    it('detects hardcoded cookie secret (single quotes)', () => {
      const content = `app.use(cookieParser('mysecretkey123'))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/hardcoded-cookie-secret');
    });

    it('detects hardcoded cookie secret (double quotes)', () => {
      const content = `app.use(cookieParser("supersecret"))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/hardcoded-cookie-secret');
      expect(findings[0].severity).toBe('high');
    });

    it('does not flag cookieParser with env var', () => {
      const content = `app.use(cookieParser(process.env.COOKIE_SECRET))`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/hardcoded-cookie-secret',
      );
      expect(flagged).toHaveLength(0);
    });

    it('does not flag cookieParser() with no argument', () => {
      const content = `app.use(cookieParser())`;
      const findings = detectMisconfiguration(content, 'src/app.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/hardcoded-cookie-secret',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // location / lineRange metadata
  // ---------------------------------------------------------------------------

  it('populates location and lineRange fields', () => {
    const content = `// line 1\napp.use(express.json())\n`;
    const findings = detectMisconfiguration(content, 'src/server.ts');
    const f = findings.find((x) => x.ruleId === 'express/json-body-no-limit');
    expect(f?.location).toBe('src/server.ts');
    expect(f?.lineRange).toBe('2');
  });
});

// =============================================================================
// detectInsecurePatterns
// =============================================================================

describe('detectInsecurePatterns', () => {
  // ---------------------------------------------------------------------------
  // express/open-redirect
  // ---------------------------------------------------------------------------

  describe('express/open-redirect', () => {
    it('detects open redirect via req.query', () => {
      const content = `res.redirect(req.query.returnUrl)`;
      const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/open-redirect');
      expect(findings[0].severity).toBe('high');
    });

    it('detects open redirect via req.params', () => {
      const content = `res.redirect(req.params.next)`;
      const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/open-redirect');
    });

    it('detects open redirect via req.body', () => {
      const content = `res.redirect(req.body.redirectTo)`;
      const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/open-redirect');
    });

    it('returns empty array for safe redirect', () => {
      const content = `res.redirect('/dashboard')`;
      const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
      const redirectFindings = findings.filter(
        (f) => f.ruleId === 'express/open-redirect',
      );
      expect(redirectFindings).toHaveLength(0);
    });

    it('returns empty array for redirect with named constant', () => {
      const content = `res.redirect(DASHBOARD_URL)`;
      const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
      const redirectFindings = findings.filter(
        (f) => f.ruleId === 'express/open-redirect',
      );
      expect(redirectFindings).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/server-side-template-injection
  // ---------------------------------------------------------------------------

  describe('express/server-side-template-injection', () => {
    it('detects SSTI via res.render with req.params', () => {
      const content = `res.render(req.params.template, data)`;
      const findings = detectInsecurePatterns(
        content,
        'src/routes/pages.ts',
      );
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/server-side-template-injection');
      expect(findings[0].severity).toBe('critical');
    });

    it('detects SSTI via res.render with req.query', () => {
      const content = `res.render(req.query.view)`;
      const findings = detectInsecurePatterns(content, 'src/routes/pages.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/server-side-template-injection');
    });

    it('detects SSTI via res.render with req.body', () => {
      const content = `res.render(req.body.page, context)`;
      const findings = detectInsecurePatterns(content, 'src/routes/pages.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/server-side-template-injection');
    });

    it('does not flag res.render with a static template name', () => {
      const content = `res.render('home', { user })`;
      const findings = detectInsecurePatterns(content, 'src/routes/pages.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/server-side-template-injection',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/eval-user-input
  // ---------------------------------------------------------------------------

  describe('express/eval-user-input', () => {
    it('detects eval with user input (req.body)', () => {
      const content = `eval(req.body.code)`;
      const findings = detectInsecurePatterns(content, 'src/routes/debug.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/eval-user-input');
      expect(findings[0].severity).toBe('critical');
    });

    it('detects eval with req.query input', () => {
      const content = `eval(req.query.expr)`;
      const findings = detectInsecurePatterns(content, 'src/routes/debug.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/eval-user-input');
    });

    it('does not flag eval with a static string', () => {
      const content = `eval('1 + 1')`;
      const findings = detectInsecurePatterns(content, 'src/routes/debug.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/eval-user-input',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // express/command-injection
  // ---------------------------------------------------------------------------

  describe('express/command-injection', () => {
    it('detects exec(req.body.*)', () => {
      const content = `exec(req.body.cmd, callback)`;
      const findings = detectInsecurePatterns(content, 'src/routes/shell.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/command-injection');
      expect(findings[0].severity).toBe('critical');
    });

    it('detects exec with template literal interpolation of req.*', () => {
      const content = 'exec(`ls ${req.query.dir}`, callback)';
      const findings = detectInsecurePatterns(content, 'src/routes/shell.ts');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('express/command-injection');
    });

    it('does not flag exec with a static command string', () => {
      const content = `exec('ls -la /tmp', callback)`;
      const findings = detectInsecurePatterns(content, 'src/routes/shell.ts');
      const flagged = findings.filter(
        (f) => f.ruleId === 'express/command-injection',
      );
      expect(flagged).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // location / lineRange metadata
  // ---------------------------------------------------------------------------

  it('populates location and lineRange fields', () => {
    const content = `// line 1\n// line 2\nres.redirect(req.query.next)\n`;
    const findings = detectInsecurePatterns(content, 'src/routes/auth.ts');
    const f = findings.find((x) => x.ruleId === 'express/open-redirect');
    expect(f?.location).toBe('src/routes/auth.ts');
    expect(f?.lineRange).toBe('3');
  });
});
