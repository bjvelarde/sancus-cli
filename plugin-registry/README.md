# Sancus Plugin Registry

The central marketplace registry for Sancus security plugins. This directory manages plugin discovery, metadata, and marketplace integration.

---

## Structure

```
plugin-registry/
├── registry.json          # Plugin registry (all published plugins)
├── schema.json           # JSON schema for validating registry entries
├── SUBMISSION.md         # Guidelines for plugin authors
└── README.md            # This file
```

---

## Registry Format

`registry.json` contains all available plugins. Each entry has:

```json
{
  "plugin-id": {
    "id": "plugin-id",
    "name": "Plugin Name",
    "version": "1.0.0",
    "description": "What it detects",
    "author": "Author Name",
    "repository": "https://github.com/author/repo",
    "license": "MIT",
    "keywords": ["keyword1", "keyword2"],
    "category": "framework|rules|reporting|utilities|language|integration",
    "tags": ["framework-name", "issue-type"],
    "npmPackage": {
      "name": "@sancus/plugin-id",
      "minVersion": "1.0.0",
      "url": "https://www.npmjs.com/package/@sancus/plugin-id"
    },
    "metadata": {
      "verified": true,
      "featured": false,
      "downloads": 100,
      "rating": 4.8,
      "lastUpdated": "2026-06-13T00:00:00Z"
    },
    "documentation": {
      "url": "https://github.com/author/repo",
      "readme": "https://raw.githubusercontent.com/author/repo/main/README.md",
      "changelog": "https://raw.githubusercontent.com/author/repo/main/CHANGELOG.md"
    },
    "requirements": {
      "minNodeVersion": "18.0.0",
      "sdkVersion": "^1.0.0",
      "dependencies": ["other-plugin-id"]
    }
  }
}
```

---

## Fields Explained

### Core Fields (Required)

| Field             | Type   | Description                                 |
| ----------------- | ------ | ------------------------------------------- |
| `id`              | string | Unique identifier (lowercase, hyphens only) |
| `name`            | string | Human-readable plugin name                  |
| `version`         | string | Current version (semver format)             |
| `description`     | string | What the plugin detects                     |
| `author`          | string | Author or maintainer name                   |
| `npmPackage.name` | string | Full npm package name                       |

### Metadata Fields

| Field        | Type     | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| `keywords`   | string[] | Searchable keywords                                 |
| `category`   | string   | Plugin category (framework, rules, reporting, etc.) |
| `tags`       | string[] | Framework or domain tags                            |
| `repository` | string   | Source code repository URL                          |
| `license`    | string   | License type (MIT, Apache-2.0, etc.)                |

### Community Fields

| Field                  | Type    | Description             |
| ---------------------- | ------- | ----------------------- |
| `metadata.verified`    | boolean | Official Sancus plugin  |
| `metadata.featured`    | boolean | Featured in marketplace |
| `metadata.downloads`   | integer | Monthly download count  |
| `metadata.rating`      | number  | Community rating (0-5)  |
| `metadata.lastUpdated` | string  | ISO 8601 timestamp      |

### Documentation Fields

| Field                     | Type   | Description             |
| ------------------------- | ------ | ----------------------- |
| `documentation.url`       | string | Main documentation link |
| `documentation.readme`    | string | Raw README file link    |
| `documentation.changelog` | string | Changelog file link     |

### Requirements Fields

| Field                         | Type     | Description                           |
| ----------------------------- | -------- | ------------------------------------- |
| `requirements.minNodeVersion` | string   | Minimum Node.js version               |
| `requirements.sdkVersion`     | string   | Compatible SDK version (semver range) |
| `requirements.dependencies`   | string[] | Required plugins                      |

---

## Validation

The registry is validated against `schema.json` using JSON Schema (Draft 7).

Validate manually:

```bash
npx ajv validate -s plugin-registry/schema.json -d plugin-registry/registry.json
```

---

## Publishing a Plugin

### 1. Publish to npm

```bash
npm publish  # Your plugin is now on npm
```

### 2. Add to Registry

1. Fork [sancus-cli repository](https://github.com/sancus-project/sancus-cli)
2. Edit `plugin-registry/registry.json`
3. Add your plugin entry
4. Submit a PR

### 3. Verification

After approval, your plugin receives:

- ✅ Entry in official registry
- ✅ Accessible via `sancus plugin search`
- ✅ Auto-discoverable when installed via npm

---

## Plugin Discovery

### The Sancus CLI discovers plugins via:

1. **Auto-detection** from `package.json` dependencies
   - Looks up dependency → registry → plugin mapping
   - Automatically loads known plugins

2. **Explicit Installation** via `sancus plugin install`
   - User searches marketplace
   - Downloads from npm
   - Registers in local config

3. **Manual Configuration** in `.sancusrc`
   - Users specify plugins explicitly
   - Override auto-detection

---

## Registry Access

### Via CLI

```bash
# Search plugins
sancus plugin search react

# List all plugins
sancus plugin list

# Show plugin details
sancus plugin info hello-world

# Install plugin
sancus plugin install hello-world
```

### Via API (Future)

In Phase 6.7, the registry will be served via HTTP API:

```
GET https://registry.sancus.dev/plugins
GET https://registry.sancus.dev/plugins/search?q=react
GET https://registry.sancus.dev/plugins/hello-world
```

---

## Plugin Categories

| Category        | Purpose                      | Examples                           |
| --------------- | ---------------------------- | ---------------------------------- |
| **framework**   | Framework-specific detectors | react-security, nextjs-safety      |
| **rules**       | Specific security rules      | sql-injection-detector, xss-finder |
| **reporting**   | Custom report generation     | pdf-exporter, slack-notifier       |
| **utilities**   | Helper and utility plugins   | logger-plugin, analyzer-helper     |
| **language**    | Language-specific checks     | python-security, rust-checker      |
| **integration** | Third-party integrations     | github-action, gitlab-ci           |

---

## Plugin Tags

Common tags for filtering:

### Frameworks

- nextjs, react, express, fastapi, django, graphql, trpc, prisma

### Languages

- typescript, javascript, python, java, golang

### Issue Types

- security, performance, reliability, best-practice

### Features

- authentication, database, api, middleware, validation

---

## Marketplace Features

### Current (Phase 6.2)

- ✅ Centralized registry
- ✅ Plugin discovery and search
- ✅ Installation via npm
- ✅ Basic ratings and download counts
- ✅ Community vs. official badges

### Coming (Phase 6.7)

- 🔄 HTTP API for registry
- 🔄 Advanced analytics
- 🔄 Licensed/commercial packs
- 🔄 Automatic updates
- 🔄 Usage statistics

### Coming (Phase 6.8+)

- 🔄 Plugin reviews and comments
- 🔄 Dependency graph
- 🔄 Version history
- 🔄 Compatibility matrix

---

## Guidelines

### For Plugin Authors

- **See:** [SUBMISSION.md](./SUBMISSION.md) for submission guidelines
- **Examples:** [examples/](../examples/) for working code
- **SDK:** [@sancus/plugin-sdk](../packages/plugin-sdk) for API reference

### For Maintainers

When approving plugins:

1. Verify plugin exists on npm
2. Validate registry entry against schema
3. Check security (no malware, tracking, hardcoded secrets)
4. Verify tests and documentation
5. Merge PR and tag as approved

---

## Support

- **Questions:** Open an issue in [sancus-cli](https://github.com/sancus-project/sancus-cli/issues)
- **Reporting Issues:** Include plugin ID, version, and steps to reproduce
- **Suggesting Plugins:** Discuss in GitHub discussions

---

## Schema

The registry schema (`schema.json`) enforces:

- ✅ Required fields are present
- ✅ Field types are correct
- ✅ IDs follow naming conventions (lowercase, hyphens)
- ✅ Versions follow semver
- ✅ Categories are valid
- ✅ URLs are properly formatted

---

**Marketplace Status:** Active  
**Last Updated:** 2026-06-13  
**Total Plugins:** 3 (all examples, more coming)
