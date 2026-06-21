# @sancus/sample-sarif-reporter

A sample Sancus reporter extension that converts scan findings into **SARIF 2.1.0** — the industry-standard format used by GitHub Code Scanning, VS Code's SARIF Viewer, and Azure DevOps.

---

## What is SARIF?

**SARIF** (Static Analysis Results Interchange Format) is an [OASIS open standard](https://docs.oasis-open.org/sarif/sarif/v2.1.0/) for the output of static analysis tools. Emitting SARIF means your Sancus results can be:

- **Uploaded to GitHub Code Scanning** — findings appear as annotations directly on pull requests and in the Security tab of your repository.
- **Viewed in VS Code** — the [SARIF Viewer extension](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer) surfaces findings inline in your editor.
- **Ingested by Azure DevOps** — the [SARIF SAST Scans Tab](https://marketplace.visualstudio.com/items?itemName=sariftools.scans) renders results in pipeline runs.

---

## How this reporter works

This extension is a **reporter** — it does not detect anything itself. All work happens in the `postScan()` hook, which Sancus calls once after all detector plugins have finished.

```
Sancus engine
  └─ runs all detector plugins  →  collects findings
  └─ calls postScan(findings)   →  sarif-reporter formats & writes output
```

1. `postScan()` receives the full list of findings from every detector.
2. `formatReport()` in `src/formatter.ts` converts them into a SARIF 2.1.0 JSON structure.
3. `writeOutput()` in `src/output.ts` writes the result to **`sancus-results.sarif`** in the project root.
4. `postScan()` returns the original findings unchanged so other reporters or the engine can continue processing.

> **Note:** `detect()` always returns `[]`. The `files: ['**/*']` glob is required so the engine feeds the plugin all files and ultimately calls `postScan`.

---

## Usage

### Install alongside a detection plugin

```jsonc
// sancus.config.json
{
  "plugins": [
    "@sancus/plugin-injection-detector",   // or any detector(s)
    "@sancus/sample-sarif-reporter"        // this reporter
  ]
}
```

### Run a scan

```bash
sancus scan --project .
```

After the scan completes, `sancus-results.sarif` is written to your project root.

---

## Output format

The generated file is a valid SARIF 2.1.0 document:

```json
{
  "version": "2.1.0",
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Documents/CommitteeSpecifications/2.1.0/sarif-schema-2.1.0.json",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "Sancus",
          "version": "1.0.0",
          "informationUri": "https://github.com/sancus-security/sancus-cli",
          "rules": [
            {
              "id": "ruby/sql-injection",
              "name": "RubySqlInjection",
              "shortDescription": { "text": "SQL injection detected" }
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "ruby/sql-injection",
          "level": "error",
          "message": { "text": "SQL injection detected" },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "app/models/user.rb",
                  "uriBaseId": "%SRCROOT%"
                },
                "region": { "startLine": 42 }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Severity → SARIF level mapping

| Sancus severity | SARIF level |
|----------------|-------------|
| `critical`     | `error`     |
| `high`         | `error`     |
| `medium`       | `warning`   |
| `low`          | `warning`   |
| `info`         | `note`      |

---

## Uploading results to GitHub Code Scanning

After running a scan, upload the SARIF file using the [GitHub CLI](https://cli.github.com/):

```bash
gh code-scanning upload-results \
  --ref "$(git rev-parse HEAD)" \
  --sarif sancus-results.sarif
```

Or use the official GitHub Action in a CI workflow:

```yaml
- name: Run Sancus scan
  run: sancus scan --project .

- name: Upload SARIF to GitHub Code Scanning
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: sancus-results.sarif
```

Findings will appear in the **Security → Code scanning alerts** tab of your repository and as inline annotations on pull requests.

---

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Type-check without emitting
npm run typecheck
```

---

## Related resources

- **Reporter template** (C1): [`../../templates/reporter-extension/`](../../templates/reporter-extension/)
- **SDK API reference**: [`../../docs/api-reference.md`](../../docs/api-reference.md)
- [SARIF 2.1.0 specification](https://docs.oasis-open.org/sarif/sarif/v2.1.0/)
- [GitHub Code Scanning SARIF support](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning)
