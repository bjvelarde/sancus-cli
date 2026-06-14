# @sancus/marketplace

Community marketplace for Sancus security plugins and frameworks.

## Overview

The `@sancus/marketplace` package provides:

- **Plugin Registry**: Centralized registry of available plugins
- **Plugin Installation**: Install, uninstall, and manage plugins
- **Plugin Discovery**: Search and list plugins with advanced filtering
- **Registry Provider Abstraction**: Pluggable registry implementations (static, HTTP, custom)
- **Plugin Manifest Management**: Track installed plugins and their versions
- **Update Management**: Check for and upgrade installed plugins

## Installation

```bash
pnpm install @sancus/marketplace
```

## Quick Start

### Search for plugins

```bash
import { RegistryClient } from "@sancus/marketplace";

const registry = new RegistryClient();
const results = await registry.search({ query: "react" });
console.log(results);
```

### Install a plugin

```bash
import { installPlugin } from "@sancus/marketplace";

await installPlugin("hello-world");
```

### List installed plugins

```bash
import { getManifestManager } from "@sancus/marketplace";

const manifest = getManifestManager();
const installed = await manifest.getInstalled();
console.log(installed);
```

### Check for updates

```bash
import { checkUpdates } from "@sancus/marketplace";

await checkUpdates();
```

### Upgrade a plugin

```bash
import { upgradePlugin } from "@sancus/marketplace";

await upgradePlugin("hello-world", "2.0.0");
```

## Registry Providers

The marketplace uses a provider pattern to allow different registry implementations.

### Switching Providers

```bash
import { RegistryProviderFactory } from "@sancus/marketplace";

// Use static JSON registry (default)
RegistryProviderFactory.setConfig({ type: "static" });

// Use HTTP registry (Phase 6.7)
// RegistryProviderFactory.setConfig({ type: "http" });

// Use custom provider
// RegistryProviderFactory.setConfig({
//   type: "custom",
//   customProvider: new MyCustomProvider(),
// });

const provider = RegistryProviderFactory.create();
```

### Creating a Custom Provider

```typescript
import { RegistryProvider } from "@sancus/marketplace";

class MyCustomProvider implements RegistryProvider {
  async getRegistry() {
    /* ... */
  }
  async getPlugin(id: string) {
    /* ... */
  }
  async listPlugins() {
    /* ... */
  }
  async search(options) {
    /* ... */
  }
  async getFeatured(limit?) {
    /* ... */
  }
  async getByCategory(category: string) {
    /* ... */
  }
  async getByTag(tag: string) {
    /* ... */
  }
  async checkUpdates(installed) {
    /* ... */
  }
}
```

## CLI Usage

```bash
# Search for plugins
sancus plugin search react

# List installed plugins
sancus plugin list

# Install a plugin
sancus plugin install hello-world

# Uninstall a plugin
sancus plugin uninstall hello-world

# Check for updates
sancus plugin update

# Upgrade a plugin
sancus plugin upgrade hello-world

# Upgrade to specific version
sancus plugin upgrade hello-world --version 2.0.0

# Get plugin info
sancus plugin info hello-world
```

## API Reference

### ManifestManager

Manages the local plugin manifest (`~/.sancus/plugins.json`).

```typescript
interface ManifestManager {
  load(): Promise<PluginManifest>;
  save(): Promise<void>;
  getInstalled(): Promise<InstalledPlugin[]>;
  getPlugin(id: string): Promise<InstalledPlugin | null>;
  install(id, version, source?, npm_package?): Promise<void>;
  uninstall(id): Promise<boolean>;
  enable(id): Promise<boolean>;
  disable(id): Promise<boolean>;
  getEnabled(): Promise<InstalledPlugin[]>;
  isInstalled(id): Promise<boolean>;
  updateVersion(id, newVersion): Promise<boolean>;
  getManifestPath(): string;
  clear(): Promise<void>;
}
```

### RegistryClient

Client for querying the plugin registry.

```typescript
interface RegistryClient {
  getRegistry(
    forceRefresh?: boolean,
  ): Promise<Record<string, PluginRegistryEntry>>;
  getPlugin(id: string): Promise<PluginRegistryEntry | null>;
  listPlugins(): Promise<PluginRegistryEntry[]>;
  search(options: SearchOptions): Promise<PluginRegistryEntry[]>;
  getFeatured(limit?: number): Promise<PluginRegistryEntry[]>;
  getByCategory(category: string): Promise<PluginRegistryEntry[]>;
  getByTag(tag: string): Promise<PluginRegistryEntry[]>;
  checkUpdates(
    installed: Record<string, string>,
  ): Promise<Record<string, { current: string; latest: string }>>;
}
```

### Installation Functions

```typescript
// Install a plugin from the marketplace
async function installPlugin(pluginId: string, version?: string): Promise<void>;

// Uninstall a plugin
async function uninstallPlugin(
  pluginId: string,
  force?: boolean,
): Promise<void>;

// Check for updates to installed plugins
async function checkUpdates(pluginId?: string): Promise<void>;

// Upgrade a plugin to a newer version
async function upgradePlugin(
  pluginId: string,
  targetVersion?: string,
): Promise<void>;
```

## Configuration

The marketplace respects environment variables:

```bash
# Use custom registry URL
SANCUS_REGISTRY_URL=https://custom-registry.example.com

# Use local registry for development
SANCUS_CLI_PATH=/path/to/sancus-cli

# Custom credential store
SANCUS_CREDENTIAL_STORE=encrypted-file
```

## File Structure

- `~/.sancus/plugins.json` - Plugin manifest
- `~/.sancus/cache/registry.json` - Cached registry (24-hour TTL)
- `~/.sancus/plugins/` - Installed plugin packages

## Roadmap

### Phase 6.3

- [ ] License validation integration
- [ ] Entitlement checks in marketplace
- [ ] Pack concept introduction

### Phase 6.7

- [ ] HTTP registry provider implementation
- [ ] Remote marketplace API (marketplace.sancus.dev)
- [ ] License server integration
- [ ] Usage analytics

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT
