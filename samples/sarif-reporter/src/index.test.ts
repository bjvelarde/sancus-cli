import { describe, it, expect } from 'vitest';
import { formatSarif, severityToLevel, parseLocation } from './formatter.js';
import type { Finding } from '@sancus/plugin-sdk';

describe('severityToLevel', () => {
  it('maps critical and high to error', () => {
    expect(severityToLevel('critical')).toBe('error');
    expect(severityToLevel('high')).toBe('error');
  });
  it('maps medium and low to warning', () => {
    expect(severityToLevel('medium')).toBe('warning');
    expect(severityToLevel('low')).toBe('warning');
  });
  it('maps info to note', () => {
    expect(severityToLevel('info')).toBe('note');
  });
});

describe('parseLocation', () => {
  it('parses file:line format', () => {
    const result = parseLocation('src/app.ts:42');
    expect(result.uri).toBe('src/app.ts');
    expect(result.startLine).toBe(42);
  });
  it('parses file:startLine-endLine format', () => {
    const result = parseLocation('src/app.ts:10-15');
    expect(result.uri).toBe('src/app.ts');
    expect(result.startLine).toBe(10);
    expect(result.endLine).toBe(15);
  });
  it('handles undefined location', () => {
    const result = parseLocation(undefined);
    expect(result.uri).toBe('unknown');
    expect(result.startLine).toBe(1);
  });
});

describe('formatSarif', () => {
  const findings: Finding[] = [
    {
      ruleId: 'ruby/sql-injection',
      message: 'SQL injection detected',
      severity: 'critical',
      location: 'app/models/user.rb:42',
      recommendation: 'Use parameterized queries',
    },
    {
      ruleId: 'express/open-redirect',
      message: 'Open redirect via user input',
      severity: 'high',
      location: 'src/routes/auth.ts:15-16',
    },
  ];

  it('produces valid SARIF 2.1.0 structure', () => {
    const sarif = formatSarif(findings, '1.0.0', '/home/project');
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe('Sancus');
  });

  it('includes all findings as results', () => {
    const sarif = formatSarif(findings, '1.0.0', '/home/project');
    expect(sarif.runs[0].results).toHaveLength(2);
  });

  it('deduplicates rules', () => {
    const duplicateFindings: Finding[] = [
      { ruleId: 'ruby/sql-injection', message: 'msg1', severity: 'critical', location: 'a.rb:1' },
      { ruleId: 'ruby/sql-injection', message: 'msg2', severity: 'critical', location: 'a.rb:5' },
    ];
    const sarif = formatSarif(duplicateFindings, '1.0.0', '/home/project');
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(1);
    expect(sarif.runs[0].results).toHaveLength(2);
  });

  it('maps critical findings to error level', () => {
    const sarif = formatSarif(findings, '1.0.0', '/home/project');
    const criticalResult = sarif.runs[0].results.find(r => r.ruleId === 'ruby/sql-injection');
    expect(criticalResult?.level).toBe('error');
  });

  it('strips projectRoot from location URIs', () => {
    const sarif = formatSarif(findings, '1.0.0', '/home/project');
    // location 'app/models/user.rb:42' — no projectRoot prefix here, should be as-is
    const result = sarif.runs[0].results[0];
    expect(result.locations?.[0].physicalLocation.artifactLocation.uri).toBe('app/models/user.rb');
  });
});
