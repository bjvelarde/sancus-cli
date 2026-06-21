import type { SancusPlugin, ScannedFile, PluginContext, Finding } from '@sancus/plugin-sdk';
import { formatReport } from './formatter.js';
import { writeOutput } from './output.js';

export const sancusPlugin: SancusPlugin = {
  metadata: {
    id: 'sarif-reporter',
    name: '@sancus/sample-sarif-reporter',
    version: '1.0.0',
    author: 'Sancus Team',
    description: 'Outputs Sancus findings as SARIF 2.1.0 for GitHub Code Scanning and compatible tools',
    keywords: ['sancus', 'reporter', 'sarif', 'github-actions', 'code-scanning'],
    license: 'MIT',
    repository: 'https://github.com/sancus-security/sancus-cli',
    sdkVersion: '1.0.0',
    engineCompatibility: '>=0.2.0',
    capabilities: ['filesystem'],
  },

  // Reporters receive all files — detect() returns []
  files: ['**/*'],

  async detect(_file: ScannedFile, _context: PluginContext): Promise<Finding[]> {
    return [];
  },

  async postScan(findings: Finding[], context: PluginContext): Promise<Finding[]> {
    context.logger.info(`SARIF reporter: formatting ${findings.length} finding(s)`);

    const report = formatReport(findings, {
      projectRoot: context.config.projectRoot,
      generatedAt: new Date().toISOString(),
    });

    await writeOutput(report, context);

    return findings;
  },
};

export default sancusPlugin;
