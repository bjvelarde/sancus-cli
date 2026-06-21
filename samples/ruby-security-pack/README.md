# @sancus/sample-ruby-security-pack

A sample Sancus **language pack** that demonstrates real, working security detection logic for Ruby and Rails codebases. This extension is part of the Sancus **C3 Sample Extensions** milestone and serves as a reference implementation for authors building their own language packs.

---

## What it detects

| Rule ID | Severity | What it detects |
|---|---|---|
| `ruby/sql-injection-where-interpolation` | critical | ActiveRecord `.where()` calls with Ruby string interpolation (`#{}`) directly in the SQL string — bypasses parameterization |
| `ruby/sql-injection-find-by-sql` | critical | `find_by_sql` called with a SQL string built via `+` string concatenation |
| `ruby/sql-injection-raw-execute` | critical | `connection.execute()` called with a SQL string containing Ruby interpolation |
| `ruby/marshal-load` | critical | `Marshal.load` used to deserialize binary data — arbitrary Ruby object graph execution |
| `ruby/yaml-load-unsafe` | high | `YAML.load` (Psych full-object mode) instead of `YAML.safe_load` — can instantiate arbitrary Ruby objects via `!ruby/object:` tags |
| `ruby/json-load-unsafe` | medium | `JSON.load` / `JSON.restore` instead of `JSON.parse` — `create_additions` hooks can instantiate arbitrary classes |

All findings include:
- Rule ID, severity, and confidence
- Human-readable message and recommendation
- File path and line number (`location`)
- Code snippet with surrounding context
- References to OWASP and relevant CVEs

---

## Scanned file types

```
**/*.rb
**/*.rake
**/Rakefile
**/Gemfile
```

---

## Running a scan

> Requires the Sancus CLI installed globally or locally.

```bash
npx sancus scan . --plugins ./samples/ruby-security-pack/src/index.ts
```

To scan a specific directory:

```bash
npx sancus scan ./my-rails-app --plugins ./samples/ruby-security-pack/src/index.ts
```

---

## Build and test

```bash
# Install dependencies
npm install

# Run unit tests (Vitest)
npm test

# Type-check without emitting output
npm run typecheck

# Compile to dist/
npm run build
```

### Test output example

```
✓ detectSqlInjection > detects where() string interpolation
✓ detectSqlInjection > detects find_by_sql with string concat
✓ detectSqlInjection > detects execute() with string interpolation
✓ detectSqlInjection > returns empty array for safe parameterized query
✓ detectInsecureDeserialization > detects Marshal.load
✓ detectInsecureDeserialization > detects YAML.load (unsafe)
✓ detectInsecureDeserialization > does not flag YAML.safe_load
✓ detectInsecureDeserialization > detects JSON.load
```

---

## Project structure

```
samples/ruby-security-pack/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts                        # SancusPlugin entry point
    ├── index.test.ts                   # Vitest unit tests
    └── rules/
        ├── index.ts                    # Re-exports all rule functions
        ├── sql-injection.ts            # SQL injection detectors
        └── insecure-deserialization.ts # Deserialization detectors
```

---

## SDK contract compliance

This plugin implements the `SancusPlugin` interface from `@sancus/plugin-sdk`:

- **`metadata`** — includes B3 extended fields (`sdkVersion`, `engineCompatibility`, `capabilities`)
- **`files`** — glob patterns for Ruby source files
- **`initialize()`** — checks for `Gemfile` at project root, warns if absent (does not abort)
- **`detect()`** — runs all rule modules, returns `Finding[]`
- **`postScan()`** — logs a summary line if any findings were produced, returns findings unchanged

All `Finding` objects use only fields present in the SDK contract. `cvssScore` is **not** used (removed in A3.3).

---

## Related resources

- [C1 Language-Pack Template](../../templates/language-pack/) — start here when building your own language pack
- [SDK API Reference](../../docs/api-reference.md) — full `SancusPlugin`, `Finding`, and `PluginContext` interface documentation
- [Sancus Architecture Constitution](../../docs/constitution.md) — SDK boundary rules and milestone roadmap

---

## Security references

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP Insecure Deserialization](https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data)
- [CVE-2013-0156 — Rails XML parameter parsing (Marshal/YAML)](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-0156)
- [CVE-2022-25857 — Psych YAML deserialization](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-25857)
- [Rails Security Guide — SQL Injection](https://guides.rubyonrails.org/security.html#sql-injection)

---

## License

MIT — see [LICENSE](../../LICENSE).
