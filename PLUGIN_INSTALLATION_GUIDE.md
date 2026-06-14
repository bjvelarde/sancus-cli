# Installing & Managing Plugins

Guide for using the Sancus plugin marketplace to discover, install, and manage security plugins.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Searching Plugins](#searching-plugins)
3. [Installing Plugins](#installing-plugins)
4. [Managing Plugins](#managing-plugins)
5. [Plugin Auto-Loading](#plugin-auto-loading)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Search for Plugins

```bash
$ sancus plugin search react

📦 Found 3 plugin(s)

• React Security Plugin ✅ [VERIFIED] (4.8/5)
  ID: react-security v1.0.0
  Detects unsafe React patterns and hook issues
  📥 156 downloads
```

### Install a Plugin

```bash
$ sancus plugin install react-security
📥 Installing React Security Plugin...
   Installing from npm: @sancus/plugin-react-security@1.0.0
   added 5 packages in 3s
✅ Plugin installed successfully
   Run 'sancus scan' to auto-load the plugin
```

### Run Scans with Plugins

```bash
$ sancus scan .
✅ Provider architecture loaded
📦 Loaded 1 plugin(s)
✅ Loaded plugin: React Security

📊 Scan Results
...
```

---

## Searching Plugins

### Basic Search

Search by keyword (searches name, description, keywords, tags):

```bash
sancus plugin search <keyword>
```

Examples:

```bash
$ sancus plugin search react
$ sancus plugin search typescript
$ sancus plugin search security
```

### Search Options

Filter results:

```bash
# By category
$ sancus plugin search --category framework

# By tags
$ sancus plugin search --tags typescript --tags nextjs

# Show only verified plugins
$ sancus plugin search --verified

# Limit results
$ sancus plugin search react --limit 5
```

### Available Categories

| Category      | Purpose                      |
| ------------- | ---------------------------- |
| `framework`   | Framework-specific detectors |
| `rules`       | Specific security rules      |
| `reporting`   | Custom report generation     |
| `utilities`   | Helper and utility plugins   |
| `language`    | Language-specific checks     |
| `integration` | Third-party integrations     |

### Common Tags

**Frameworks:** `nextjs`, `react`, `express`, `fastapi`, `django`, `graphql`, `trpc`

**Languages:** `typescript`, `javascript`, `python`, `java`, `golang`

**Issues:** `security`, `performance`, `reliability`, `best-practice`

---

## Installing Plugins

### Standard Installation

```bash
sancus plugin install <plugin-id>
```

This:

1. Looks up plugin in registry
2. Downloads npm package
3. Installs to ~/.sancus/plugins/
4. Registers in manifest

Example:

```bash
$ sancus plugin install hello-world
📥 Installing Hello World Plugin...
   Installing from npm: @sancus/plugin-hello-world@1.0.0
   added 2 packages
✅ Plugin installed successfully
   Run 'sancus scan' to auto-load the plugin
```

### Install Specific Version

```bash
sancus plugin install <plugin-id> --version <version>
```

Example:

```bash
$ sancus plugin install hello-world --version 1.5.0
```

### What Gets Installed

Plugins are installed to your home directory:

```
~/.sancus/
├── plugins/                                    # Plugin directory
│   ├── node_modules/                          # npm packages
│   │   └── @sancus/
│   │       ├── plugin-hello-world/
│   │       ├── plugin-react-security/
│   │       └── ...
│   └── package-lock.json
└── plugins.json                               # Manifest (see below)
```

---

## Managing Plugins

### View Installed Plugins

```bash
$ sancus plugin list
📋 Installed plugins (3)

✅ hello-world v1.0.0 (6/13/2026)
✅ react-security v1.2.0 (6/12/2026)
⏸️ framework-detector v1.0.0 (6/10/2026)
   └─ Disabled
```

**Legend:**

- ✅ = Enabled (will load in scans)
- ⏸️ = Disabled (skipped in scans)
- Date = Installation date

### Get Plugin Details

```bash
$ sancus plugin info react-security
📦 React Security Plugin v1.2.0
   ID: react-security
   Author: Sancus Security Team
   Description: Detects unsafe React patterns and hook issues
   Repository: https://github.com/sancus-project/plugin-react-security
   License: MIT

   📊 Metrics:
   • Verified: ✅
   • Featured: ⭐
   • Downloads: 156
   • Rating: 4.8/5

   📖 Documentation:
   https://github.com/sancus-project/plugin-react-security
```

### Check for Updates

```bash
$ sancus plugin update
🔍 Checking for updates...

✅ hello-world (v1.0.0) is up to date
📦 react-security: 1.2.0 → 1.3.0 available
✅ framework-detector (v1.0.0) is up to date

💡 Tip: Run 'sancus plugin install <id> --version <version>' to upgrade
```

Check specific plugin:

```bash
$ sancus plugin update react-security
```

### Upgrade a Plugin

```bash
$ sancus plugin install react-security --version 1.3.0
```

Or interactively:

```bash
$ sancus plugin install react-security
⚠️  Plugin "react-security" is already installed (v1.2.0)
   Use 'sancus plugin update react-security' to upgrade
```

### Uninstall a Plugin

```bash
$ sancus plugin uninstall <plugin-id>
Are you sure you want to uninstall "<plugin-id>"?
Run with --force to skip confirmation
```

With confirmation:

```bash
$ sancus plugin uninstall react-security --force
🗑️  Uninstalling react-security...
   removed 5 packages in 2s
✅ Plugin uninstalled successfully
```

---

## Plugin Auto-Loading

### How Plugins Load

When you run `sancus scan`:

1. Sancus checks `~/.sancus/plugins.json`
2. Looks for enabled plugins
3. Loads npm packages from `~/.sancus/plugins/node_modules/`
4. Runs detect() on each file
5. Includes findings in results

```bash
$ sancus scan .
✅ Provider architecture loaded
📦 Loaded 1 plugin(s)                          # ← from manifest
✅ Loaded plugin: React Security

📊 Scan Results
- 5 security issues found
  └─ 3 from React Security plugin
  └─ 2 from built-in detectors
```

### Enable/Disable Plugins

You can disable plugins without uninstalling:

**Future feature:** `sancus plugin disable <id>` / `sancus plugin enable <id>`

For now, edit `~/.sancus/plugins.json`:

```json
{
  "installed": [
    {
      "id": "react-security",
      "enabled": false // ← Change to skip loading
    }
  ]
}
```

---

## Manifest File

The manifest tracks installed plugins:

**Location:** `~/.sancus/plugins.json`

**Structure:**

```json
{
  "version": "1.0",
  "installed": [
    {
      "id": "hello-world",
      "version": "1.0.0",
      "installed_at": "2026-06-13T12:00:00Z",
      "enabled": true,
      "source": "npm",
      "npm_package": "@sancus/plugin-hello-world"
    },
    {
      "id": "react-security",
      "version": "1.2.0",
      "installed_at": "2026-06-12T18:30:00Z",
      "enabled": true,
      "source": "npm",
      "npm_package": "@sancus/plugin-react-security"
    }
  ]
}
```

**Fields:**

- `id` — Plugin identifier
- `version` — Installed version
- `installed_at` — ISO 8601 timestamp
- `enabled` — Whether to load in scans
- `source` — Installation source (npm, local, github)
- `npm_package` — npm package name

---

## Troubleshooting

### Plugin not found in registry

```
$ sancus plugin install nonexistent
❌ Plugin "nonexistent" not found in registry
```

**Solutions:**

- Check spelling: `sancus plugin search` first
- Plugin may not be published yet
- Try searching by category or tag

### Installation fails

```
❌ Installation failed: Failed to install npm package
```

**Solutions:**

- Check internet connection
- Verify npm is installed: `npm --version`
- Check package exists on npmjs.com
- Try again: npm server may be temporarily down

### Plugin not loading in scans

```
$ sancus scan .
✅ Provider architecture loaded
📦 Loaded 0 plugin(s)    # ← Expected plugins not loading
```

**Solutions:**

- Verify plugin is installed: `sancus plugin list`
- Check it's enabled (not ⏸️)
- Review ~/
  .sancus/plugins.json
- Check plugin package.json exports
- Review Sancus logs for errors

### "Already installed" error

```
$ sancus plugin install hello-world
⚠️  Plugin "hello-world" is already installed (v1.0.0)
```

**Solutions:**

- To upgrade: `sancus plugin install hello-world --version 1.1.0`
- To reinstall: Uninstall first, then install
- Check current version: `sancus plugin list`

### Disk space issues

If ~/.sancus/ directory gets large:

```bash
# See what's taking space
$ du -sh ~/.sancus/*

# Remove unused plugins
$ sancus plugin uninstall <id>

# Or manually (advanced)
$ rm -rf ~/.sancus/plugins/node_modules
```

### Clear everything

To reset and start over:

```bash
$ rm -rf ~/.sancus
# Will recreate on next plugin install
```

---

## Tips & Best Practices

### ✅ Do

- **Search first:** `sancus plugin search` before installing
- **Read details:** `sancus plugin info` shows requirements
- **Check ratings:** Verified + highly-rated plugins are vetted
- **Update regularly:** `sancus plugin update` checks for fixes
- **Read documentation:** Links in `sancus plugin info`

### ❌ Don't

- Don't install plugins from untrusted sources (always use marketplace)
- Don't manually edit manifest unless you know what you're doing
- Don't leave old plugins enabled if not using (slows down scans)
- Don't ignore security warnings from plugin vendors

---

## Getting Help

**Common commands:**

```bash
sancus plugin --help
sancus plugin search --help
sancus plugin install --help
```

**More information:**

- Plugin SDK: [@sancus/plugin-sdk](https://www.npmjs.com/package/@sancus/plugin-sdk)
- Submit issues: [sancus-cli/issues](https://github.com/sancus-project/sancus-cli/issues)
- Join community: [GitHub Discussions](https://github.com/sancus-project/sancus-cli/discussions)

---

**Happy scanning! 🔍**
