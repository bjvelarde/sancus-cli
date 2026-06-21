import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PluginContext } from '@sancus/plugin-sdk';
import type { ReportOutput } from './formatter.js';

export async function writeOutput(
  report: ReportOutput,
  context: PluginContext,
): Promise<void> {
  const outputPath = join(context.config.projectRoot, 'sancus-results.sarif');
  const json = JSON.stringify(report, null, 2);
  await writeFile(outputPath, json, 'utf8');
  context.logger.info(`SARIF report written to ${outputPath}`);
}
