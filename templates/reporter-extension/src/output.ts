/**
 * Output Writer
 *
 * Handles writing or sending the formatted report.
 *
 * TODO: Replace the placeholder implementation with your real output target:
 *   - Write to a file (using context.fs or Node's fs/promises)
 *   - POST to a webhook (Slack, Teams, Jira, Datadog, etc.)
 *   - Upload to S3 or another storage service
 *   - Print to stdout
 */

import type { PluginContext } from "@sancus/plugin-sdk";
import type { ReportOutput } from "./formatter.js";

/**
 * Writes or sends the formatted report.
 *
 * The default implementation logs the report to the console.
 * TODO: Replace with your actual delivery mechanism.
 */
export async function writeOutput(
  report: ReportOutput,
  context: PluginContext,
): Promise<void> {
  // ── Example: log to console ───────────────────────────────────────────────
  // TODO: replace with your real output mechanism.
  context.logger.info("\n" + String(report));

  // ── Example: write to file ────────────────────────────────────────────────
  // If you want to write to disk, use Node's fs/promises directly.
  // The SDK's context.fs is read-only and sandboxed to the scanned project.
  //
  // import { writeFile } from "node:fs/promises";
  // import { join } from "node:path";
  // const outputPath = join(context.config.projectRoot, "sancus-report.txt");
  // await writeFile(outputPath, String(report), "utf8");
  // context.logger.info(`Report written to ${outputPath}`);

  // ── Example: POST to webhook ──────────────────────────────────────────────
  // import { request } from "node:https";
  // ... (implement webhook delivery)
}
