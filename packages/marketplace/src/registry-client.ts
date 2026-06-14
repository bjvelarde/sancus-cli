import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

// Ensure __dirname is available (obfuscator may remove it)
const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);

/**
 * Registry entry for a plugin
 */
export interface PluginRegistryEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  npmPackage: {
    name: string;
    minVersion?: string;
    url?: string;
  };
  metadata?: {
    verified?: boolean;
    featured?: boolean;
    downloads?: number;
    rating?: number;
    lastUpdated?: string;
  };
  documentation?: {
    url?: string;
    readme?: string;
    changelog?: string;
  };
  requirements?: {
    minNodeVersion?: string;
    sdkVersion?: string;
    dependencies?: string[];
  };
}

/**
 * Search filter options
 */
export interface SearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  verified?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Registry client for fetching and searching plugins
 */
export class RegistryClient {
  private registryUrl: string;
  private localRegistryPath?: string;
  private cacheDir: string;
  private cacheTtl: number; // milliseconds

  constructor(
    registryUrl: string = "https://raw.githubusercontent.com/sancus-project/sancus-cli/main/plugin-registry/registry.json",
    cacheTtl: number = 24 * 60 * 60 * 1000, // 24 hours
    localRegistryPath?: string,
  ) {
    this.registryUrl = registryUrl;
    this.cacheTtl = cacheTtl;
    this.localRegistryPath = localRegistryPath;
    this.cacheDir = path.join(os.homedir(), ".sancus", "cache");
  }

  /**
   * Get local cache file path
   */
  private getCachePath(): string {
    return path.join(this.cacheDir, "registry.json");
  }

  /**
   * Get cache metadata file path
   */
  private getCacheMetaPath(): string {
    return path.join(this.cacheDir, "registry-meta.json");
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Check if cache is still valid
   */
  private async isCacheValid(): Promise<boolean> {
    try {
      const metaPath = this.getCacheMetaPath();
      const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));

      const age = Date.now() - meta.cachedAt;
      return age < this.cacheTtl;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load registry from cache
   */
  private async loadFromCache(): Promise<Record<
    string,
    PluginRegistryEntry
  > | null> {
    try {
      const cachePath = this.getCachePath();
      const data = await fs.readFile(cachePath, "utf-8");
      return JSON.parse(data) as Record<string, PluginRegistryEntry>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load registry from local file (for development)
   */
  private async loadFromLocalFile(): Promise<Record<
    string,
    PluginRegistryEntry
  > | null> {
    if (!this.localRegistryPath) return null;

    try {
      const data = await fs.readFile(this.localRegistryPath, "utf-8");
      return JSON.parse(data) as Record<string, PluginRegistryEntry>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save registry to cache
   */
  private async saveToCache(
    registry: Record<string, PluginRegistryEntry>,
  ): Promise<void> {
    try {
      await this.ensureCacheDir();

      const cachePath = this.getCachePath();
      await fs.writeFile(cachePath, JSON.stringify(registry, null, 2), "utf-8");

      const metaPath = this.getCacheMetaPath();
      await fs.writeFile(
        metaPath,
        JSON.stringify({ cachedAt: Date.now() }, null, 2),
        "utf-8",
      );
    } catch (error) {
      // Failed to cache, continue without caching
    }
  }

  /**
   * Fetch registry from remote URL
   */
  private async fetchFromRemote(): Promise<Record<
    string,
    PluginRegistryEntry
  > | null> {
    try {
      const response = await fetch(this.registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
      }
      return (await response.json()) as Record<string, PluginRegistryEntry>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the plugin registry (with caching)
   */
  async getRegistry(
    forceRefresh: boolean = false,
  ): Promise<Record<string, PluginRegistryEntry>> {
    // For development: try local file first if available
    if (!forceRefresh) {
      const localRegistry = await this.loadFromLocalFile();
      if (localRegistry) {
        // Cache it for subsequent use
        await this.saveToCache(localRegistry);
        return localRegistry;
      }
    }

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const isValid = await this.isCacheValid();
      if (isValid) {
        const cached = await this.loadFromCache();
        if (cached) {
          return cached;
        }
      }
    }

    // Fetch from remote
    const remote = await this.fetchFromRemote();
    if (remote) {
      await this.saveToCache(remote);
      return remote;
    }

    // Fall back to cache even if expired
    const cached = await this.loadFromCache();
    if (cached) {
      return cached;
    }

    // No registry available
    return {};
  }

  /**
   * Get a specific plugin by ID
   */
  async getPlugin(id: string): Promise<PluginRegistryEntry | null> {
    const registry = await this.getRegistry();
    return registry[id] || null;
  }

  /**
   * List all plugins
   */
  async listPlugins(): Promise<PluginRegistryEntry[]> {
    const registry = await this.getRegistry();
    return Object.values(registry);
  }

  /**
   * Search plugins
   */
  async search(options: SearchOptions = {}): Promise<PluginRegistryEntry[]> {
    const registry = await this.getRegistry();
    let results = Object.values(registry);

    // Filter by query (search in name, description, keywords)
    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter((plugin) => {
        const searchText = [
          plugin.name,
          plugin.description,
          plugin.id,
          ...(plugin.keywords || []),
          ...(plugin.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return searchText.includes(q);
      });
    }

    // Filter by category
    if (options.category) {
      results = results.filter(
        (plugin) => plugin.category === options.category,
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter((plugin) => {
        const pluginTags = plugin.tags || [];
        return options.tags!.some((tag) => pluginTags.includes(tag));
      });
    }

    // Filter by verified status
    if (options.verified !== undefined) {
      results = results.filter((plugin) => {
        return (plugin.metadata?.verified || false) === options.verified;
      });
    }

    // Filter by featured status
    if (options.featured !== undefined) {
      results = results.filter((plugin) => {
        return (plugin.metadata?.featured || false) === options.featured;
      });
    }

    // Sort by relevance/rating if there's a query
    if (options.query) {
      results.sort((a, b) => {
        const aRating = a.metadata?.rating || 0;
        const bRating = b.metadata?.rating || 0;
        return bRating - aRating;
      });
    }

    // Apply offset and limit
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get featured plugins
   */
  async getFeatured(limit: number = 10): Promise<PluginRegistryEntry[]> {
    return this.search({ featured: true, limit });
  }

  /**
   * Get plugins for a specific category
   */
  async getByCategory(category: string): Promise<PluginRegistryEntry[]> {
    return this.search({ category });
  }

  /**
   * Get plugins for a specific tag
   */
  async getByTag(tag: string): Promise<PluginRegistryEntry[]> {
    return this.search({ tags: [tag] });
  }

  /**
   * Check for plugin updates
   */
  async checkUpdates(
    installedPlugins: Record<string, string>, // id -> current version
  ): Promise<Record<string, { current: string; latest: string }>> {
    const registry = await this.getRegistry();
    const updates: Record<string, { current: string; latest: string }> = {};

    for (const [id, currentVersion] of Object.entries(installedPlugins)) {
      const entry = registry[id];
      if (entry && entry.version !== currentVersion) {
        updates[id] = {
          current: currentVersion,
          latest: entry.version,
        };
      }
    }

    return updates;
  }
}

/**
 * Detect local sancus-cli registry path for development
 * Looks for a sibling sancus-cli repository
 */
function detectLocalRegistryPath(): string | undefined {
  // Priority 1: Check environment variable
  if (process.env.SANCUS_CLI_PATH) {
    const registryPath = path.join(
      process.env.SANCUS_CLI_PATH,
      "plugin-registry/registry.json",
    );
    if (existsSync(registryPath)) {
      return registryPath;
    }
  }

  // Priority 2: Search for sancus-core package.json in common module locations
  // and look for a sibling sancus-cli
  const commonPaths = [
    // Development: running from source
    path.resolve(
      __dirname,
      "../../../sancus-cli/plugin-registry/registry.json",
    ),
    // npm link: symlinked to node_modules
    path.resolve(
      __dirname,
      "../../../../sancus-cli/plugin-registry/registry.json",
    ),
    // monorepo sibling
    path.resolve(
      __dirname,
      "../../../../../sancus-cli/plugin-registry/registry.json",
    ),
    // development root
    path.resolve(
      __dirname,
      "../../../../../../sancus-cli/plugin-registry/registry.json",
    ),
  ];

  for (const registryPath of commonPaths) {
    if (existsSync(registryPath)) {
      return registryPath;
    }
  }

  // Priority 3: Check current working directory
  const cwdPaths = [
    path.resolve(process.cwd(), "../sancus-cli/plugin-registry/registry.json"),
    path.resolve(process.cwd(), "sancus-cli/plugin-registry/registry.json"),
    path.resolve(process.cwd(), "./plugin-registry/registry.json"),
  ];

  for (const registryPath of cwdPaths) {
    if (existsSync(registryPath)) {
      return registryPath;
    }
  }

  return undefined;
}

/**
 * Create a default registry client singleton
 */
let clientInstance: RegistryClient | null = null;

export function getRegistryClient(): RegistryClient {
  if (!clientInstance) {
    const localRegistryPath = detectLocalRegistryPath();
    clientInstance = new RegistryClient(
      "https://raw.githubusercontent.com/sancus-project/sancus-cli/main/plugin-registry/registry.json",
      24 * 60 * 60 * 1000,
      localRegistryPath,
    );
  }
  return clientInstance;
}

/**
 * Reset the registry client (for testing)
 */
export function resetRegistryClient(): void {
  clientInstance = null;
}
