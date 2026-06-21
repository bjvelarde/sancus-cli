# Reporter Extension Template

A Sancus reporter extension consumes findings from a completed scan and
renders them in a custom output format.

## What is a reporter extension?

A reporter extension uses the `postScan()` hook to receive the complete
finding list (from all plugins that ran) and produce a custom output:
a SARIF file for GitHub Code Scanning, an HTML report, a Slack notification,
a CSV export, a JUnit XML for CI, etc.

**A reporter must:**
- Return `[]` from `detect()` — it does not produce findings.
- Return the findings unchanged from `postScan()` — it must not mutate them.

## Getting Started

```bash
cp -r templates/reporter-extension packages/my-reporter
cd packages/my-reporter
npm install
```

Then follow the `TODO` markers in each file:

| File | What to do |
|---|---|
| `package.json` | Update `name`, `description`, `author`, `keywords` |
| `src/index.ts` | Update `metadata` |
| `src/formatter.ts` | Implement `formatReport()` for your output format |
| `src/output.ts` | Implement `writeOutput()` for your delivery mechanism |
| `src/index.test.ts` | Add assertions for your format's output |

## Implementing a SARIF Reporter (example)

```typescript
// src/formatter.ts
import type { Finding } from "@sancus/plugin-sdk";

export type ReportOutput = SarifLog; // replace string with your type

export function formatReport(findings: Finding[], context: ReportContext): SarifLog {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: { driver: { name: "Sancus", version: "0.2.0" } },
      results: findings.map(f => ({
        ruleId: f.ruleId ?? f.type ?? "unknown",
        level: toSarifLevel(f.severity),
        message: { text: f.message },
        locations: [{ physicalLocation: { artifactLocation: { uri: String(f.location) } } }],
      })),
    }],
  };
}
```

## Implementing a Slack Reporter (example)

```typescript
// src/output.ts
import { request } from "node:https";
import type { PluginContext } from "@sancus/plugin-sdk";
import type { ReportOutput } from "./formatter.js";

export async function writeOutput(report: ReportOutput, context: PluginContext): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    context.logger.warn("SLACK_WEBHOOK_URL not set — skipping Slack notification");
    return;
  }
  // POST the report to Slack...
}
```

## Commands

```bash
npm run typecheck   # tsc --noEmit — must be clean before publishing
npm test            # run the vitest test suite
npm run build       # compile to dist/
```

## Manifest Fields (B3)

```typescript
sdkVersion: "1.0.0",
engineCompatibility: ">=0.2.0",
capabilities: ["filesystem"], // remove if your reporter only logs to stdout
```
