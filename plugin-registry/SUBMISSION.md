# Plugin Submission Guide

Welcome to the Sancus Plugin Marketplace! This guide walks you through publishing your plugin so it's discoverable by the community.

---

## 5-Step Submission Process

### Step 1: Create Your Plugin

Build your plugin using the [@sancus/plugin-sdk](../packages/plugin-sdk).

```ts
import {
  SancusPlugin,
  PluginMetadata,
  PluginContext,
  Finding,
  Severity,
  Confidence,
} from "@sancus/plugin-sdk";

export const metadata: PluginMetadata = {
  id: "my-plugin",
  name: "My Security Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "Detects specific security issues",
};

export const plugin: SancusPlugin = {
  metadata,

  async detect(file, context) {
    const findings: Finding[] = [];

    if (file.content.includes("unsafe-pattern")) {
      findings.push({
        type: "security-issue",
        severity: "high" as Severity,
        location: {
          file: file.path,
          line: 10,
          column: 5,
        },
        confidence: "high" as Confidence,
        message: "Found unsafe pattern",
        recommendation: "Replace with secure alternative",
      });
    }

    return findings;
  },
};
```

See [Plugin Examples](../examples) for complete working code.

---

### Step 2: Test Your Plugin

**Minimum Requirements:**

- Write unit tests with Vitest
- Achieve 70%+ code coverage
- Test against real projects
- Include integration tests

Example test file:

```ts
import { describe, it, expect } from "vitest";
import { plugin, metadata } from "./index";

describe("my-plugin", () => {
  it("should have valid metadata", () => {
    expect(metadata.id).toBe("my-plugin");
    expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should detect unsafe patterns", async () => {
    const mockContext = {
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };

    const findings = await plugin.detect(
      { path: "test.ts", content: "unsafe-pattern", lines: [] },
      mockContext,
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
  });
});
```

Run tests:

```bash
vitest run --coverage
```

Verify coverage meets 70%+ threshold:

```bash
vitest --coverage
```

---

### Step 3: Publish to npm

Prepare your `package.json`:

```json
{
  "name": "@sancus/plugin-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "types": "./dist/index.d.ts",
    "default": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "keywords": ["sancus", "plugin"],
  "devDependencies": {
    "@sancus/plugin-sdk": "^1.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

Build and publish:

```bash
npm run build
npm publish
```

Your package is now available at `https://www.npmjs.com/package/@sancus/plugin-my-plugin`.

---

### Step 4: Create Documentation

Write clear documentation so users understand your plugin:

**README.md** — Include:

- What the plugin detects
- Installation instructions
- Usage examples
- Configuration options
- Security considerations

**CHANGELOG.md** — Track versions:

```markdown
## [1.0.0] - 2026-06-13

### Added

- Initial release
- Basic pattern detection
- Unit tests

### Fixed

- Edge case handling
```

Create examples in your repository.

---

### Step 5: Submit to Registry

1. **Fork** [sancus-cli](https://github.com/sancus-project/sancus-cli)

2. **Edit** `plugin-registry/registry.json` and add your entry:

```json
{
  "my-plugin": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Detects X security issues",
    "author": "Your Name",
    "npmPackage": {
      "name": "@sancus/plugin-my-plugin",
      "minVersion": "1.0.0",
      "url": "https://www.npmjs.com/package/@sancus/plugin-my-plugin"
    },
    "metadata": {
      "verified": false,
      "featured": false,
      "downloads": 0,
      "rating": 0,
      "lastUpdated": "2026-06-13T00:00:00Z"
    },
    "documentation": {
      "url": "https://github.com/yourorg/my-plugin",
      "readme": "https://raw.githubusercontent.com/yourorg/my-plugin/main/README.md",
      "changelog": "https://raw.githubusercontent.com/yourorg/my-plugin/main/CHANGELOG.md"
    },
    "requirements": {
      "minNodeVersion": "18.0.0",
      "sdkVersion": "^1.0.0",
      "dependencies": []
    }
  }
}
```

3. **Submit** a Pull Request with the heading:

```
[Registry] Add my-plugin to marketplace
```

4. **Include** the verification checklist (see below)

---

## Verification Checklist

Before submitting, verify:

- [ ] **Code Quality**
  - [ ] TypeScript compiles without errors
  - [ ] ESLint/prettier passes
  - [ ] No hardcoded secrets or credentials

- [ ] **Testing**
  - [ ] Unit tests written and passing
  - [ ] 70%+ code coverage achieved
  - [ ] Integration tests with real projects

- [ ] **Documentation**
  - [ ] README.md is comprehensive
  - [ ] CHANGELOG.md tracks releases
  - [ ] Examples provided
  - [ ] Contributing guide included

- [ ] **Publishing**
  - [ ] Published to npm
  - [ ] Package is public and installable
  - [ ] package.json metadata is correct

- [ ] **Security**
  - [ ] No malware or tracking code
  - [ ] No hardcoded API keys
  - [ ] Dependencies are verified
  - [ ] Follows security best practices

---

## Naming Conventions

### Official Plugins

```
@sancus/plugin-<name>
```

Example: `@sancus/plugin-react-security`

For official plugins, contact the Sancus team.

### Community Plugins

**Recommended:**

```
@yourorg/sancus-plugin-<name>
```

Example: `@acme/sancus-plugin-custom-rules`

**Alternative:**

```
sancus-plugin-<name>
```

Example: `sancus-plugin-custom-rules`

---

## Plugin Categories

When submitting, choose one primary category:

| Category        | Purpose                      | Example                            |
| --------------- | ---------------------------- | ---------------------------------- |
| **framework**   | Framework-specific detectors | `react-security`, `nextjs-safety`  |
| **rules**       | Specific security rules      | `sql-injection-detector`           |
| **reporting**   | Custom report generation     | `pdf-exporter`, `slack-notifier`   |
| **utilities**   | Helper and utility plugins   | `logger-plugin`, `analyzer-helper` |
| **language**    | Language-specific checks     | `python-security`, `rust-checker`  |
| **integration** | Third-party integrations     | `github-action`, `gitlab-ci`       |

---

## Common Tags

When submitting, add relevant tags:

**Frameworks:** `nextjs`, `react`, `express`, `fastapi`, `django`, `graphql`, `trpc`

**Languages:** `typescript`, `javascript`, `python`, `java`, `golang`, `rust`

**Issue Types:** `security`, `performance`, `reliability`, `best-practice`

**Features:** `authentication`, `database`, `api`, `middleware`, `validation`

---

## Marketplace Policy

### Approval SLA

- **Community Plugins:** ~2 weeks
- **Official Plugins:** Expedited

### Grounds for Rejection

Plugins will be rejected if they:

- Contain malware or tracking code
- Violate trademark or licensing
- Lack documentation or tests
- Have unaddressed security vulnerabilities
- Don't follow SDK API contract

### Badges

Upon approval, your plugin receives:

- ✅ **[OFFICIAL]** — Created by Sancus team
- ✅ **[VERIFIED]** — Audited and approved by community
- ⭐ **[FEATURED]** — Highlighted in marketplace

---

## Questions?

- **Documentation:** See [@sancus/plugin-sdk](../packages/plugin-sdk/README.md)
- **Examples:** Check [examples/](../examples)
- **Issues:** File a GitHub issue
- **Discussion:** Start a discussion in GitHub

---

## Next Steps

After your plugin is approved:

1. Users can discover it: `sancus plugin search <keyword>`
2. Installation: `sancus plugin install my-plugin`
3. Auto-detection: `sancus scan .` loads it automatically
4. Feedback: Community rates and reviews your plugin

Thank you for contributing to Sancus! 🚀
