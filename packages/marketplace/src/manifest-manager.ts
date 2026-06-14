import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

/**
 * Represents an installed plugin entry in the manifest
 */
export interface InstalledPlugin {
  id: string;
  version: string;
  installed_at: string;
  enabled: boolean;
  source: "npm" | "local" | "github";
  npm_package?: string;
}

/**
 * Plugin manifest structure
 */
export interface PluginManifest {
  version: "1.0";
  installed: InstalledPlugin[];
}

/**
 * Manages the ~/.sancus/plugins.json manifest file
 */
export class ManifestManager {
  private manifestPath: string;
  private manifestDir: string;
  private manifest: PluginManifest | null = null;

  constructor(customManifestPath?: string) {
    if (customManifestPath) {
      this.manifestPath = customManifestPath;
      this.manifestDir = path.dirname(customManifestPath);
    } else {
      this.manifestDir = path.join(os.homedir(), ".sancus");
      this.manifestPath = path.join(this.manifestDir, "plugins.json");
    }
  }

  /**
   * Ensure the manifest directory exists
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.manifestDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Get the default manifest structure
   */
  private getDefaultManifest(): PluginManifest {
    return {
      version: "1.0",
      installed: [],
    };
  }

  /**
   * Load the manifest from disk
   */
  async load(): Promise<PluginManifest> {
    if (this.manifest !== null) {
      return this.manifest;
    }

    try {
      await this.ensureDir();
      const data = await fs.readFile(this.manifestPath, "utf-8");
      this.manifest = JSON.parse(data) as PluginManifest;
      return this.manifest;
    } catch (error) {
      // File doesn't exist yet or is invalid
      this.manifest = this.getDefaultManifest();
      return this.manifest;
    }
  }

  /**
   * Save the manifest to disk
   */
  async save(): Promise<void> {
    if (this.manifest === null) {
      throw new Error("Manifest not loaded. Call load() first.");
    }

    await this.ensureDir();
    await fs.writeFile(
      this.manifestPath,
      JSON.stringify(this.manifest, null, 2),
      "utf-8",
    );
  }

  /**
   * Get all installed plugins
   */
  async getInstalled(): Promise<InstalledPlugin[]> {
    const manifest = await this.load();
    return manifest.installed;
  }

  /**
   * Get a specific installed plugin
   */
  async getPlugin(id: string): Promise<InstalledPlugin | null> {
    const installed = await this.getInstalled();
    return installed.find((p) => p.id === id) || null;
  }

  /**
   * Register a newly installed plugin
   */
  async install(
    id: string,
    version: string,
    source: "npm" | "local" | "github" = "npm",
    npm_package?: string,
  ): Promise<void> {
    const manifest = await this.load();

    // Check if already installed
    const existing = manifest.installed.findIndex((p) => p.id === id);
    if (existing >= 0) {
      // Update existing entry
      manifest.installed[existing] = {
        id,
        version,
        source,
        installed_at: new Date().toISOString(),
        enabled: true,
        npm_package,
      };
    } else {
      // Add new entry
      manifest.installed.push({
        id,
        version,
        source,
        installed_at: new Date().toISOString(),
        enabled: true,
        npm_package,
      });
    }

    this.manifest = manifest;
    await this.save();
  }

  /**
   * Uninstall a plugin (remove from manifest)
   */
  async uninstall(id: string): Promise<boolean> {
    const manifest = await this.load();
    const index = manifest.installed.findIndex((p) => p.id === id);

    if (index < 0) {
      return false;
    }

    manifest.installed.splice(index, 1);
    this.manifest = manifest;
    await this.save();
    return true;
  }

  /**
   * Enable a plugin
   */
  async enable(id: string): Promise<boolean> {
    const manifest = await this.load();
    const plugin = manifest.installed.find((p) => p.id === id);

    if (!plugin) {
      return false;
    }

    plugin.enabled = true;
    this.manifest = manifest;
    await this.save();
    return true;
  }

  /**
   * Disable a plugin (keep in manifest, just skip loading)
   */
  async disable(id: string): Promise<boolean> {
    const manifest = await this.load();
    const plugin = manifest.installed.find((p) => p.id === id);

    if (!plugin) {
      return false;
    }

    plugin.enabled = false;
    this.manifest = manifest;
    await this.save();
    return true;
  }

  /**
   * Get enabled plugins only
   */
  async getEnabled(): Promise<InstalledPlugin[]> {
    const installed = await this.getInstalled();
    return installed.filter((p) => p.enabled);
  }

  /**
   * Check if a plugin is installed
   */
  async isInstalled(id: string): Promise<boolean> {
    const plugin = await this.getPlugin(id);
    return plugin !== null;
  }

  /**
   * Update a plugin version
   */
  async updateVersion(id: string, newVersion: string): Promise<boolean> {
    const manifest = await this.load();
    const plugin = manifest.installed.find((p) => p.id === id);

    if (!plugin) {
      return false;
    }

    plugin.version = newVersion;
    this.manifest = manifest;
    await this.save();
    return true;
  }

  /**
   * Get manifest file path (for debugging)
   */
  getManifestPath(): string {
    return this.manifestPath;
  }

  /**
   * Clear all plugins (for testing)
   */
  async clear(): Promise<void> {
    this.manifest = this.getDefaultManifest();
    await this.save();
  }
}

/**
 * Create a singleton instance
 */
let instanceCache: ManifestManager | null = null;

export function getManifestManager(customPath?: string): ManifestManager {
  if (!instanceCache) {
    instanceCache = new ManifestManager(customPath);
  }
  return instanceCache;
}

/**
 * Reset the singleton (for testing)
 */
export function resetManifestManager(): void {
  instanceCache = null;
}
