import { PluginRegistryEntry, SearchOptions } from "../registry-client.js";
import { StaticRegistryProvider } from "./static-registry.js";

/**
 * Abstract interface for registry providers
 * Allows swapping between static, HTTP, and custom implementations
 */
export interface RegistryProvider {
  /**
   * Get the entire plugin registry
   */
  getRegistry(
    forceRefresh?: boolean,
  ): Promise<Record<string, PluginRegistryEntry>>;

  /**
   * Get a specific plugin by ID
   */
  getPlugin(id: string): Promise<PluginRegistryEntry | null>;

  /**
   * List all plugins
   */
  listPlugins(): Promise<PluginRegistryEntry[]>;

  /**
   * Search plugins with filters
   */
  search(options: SearchOptions): Promise<PluginRegistryEntry[]>;

  /**
   * Get featured plugins
   */
  getFeatured(limit?: number): Promise<PluginRegistryEntry[]>;

  /**
   * Get plugins by category
   */
  getByCategory(category: string): Promise<PluginRegistryEntry[]>;

  /**
   * Get plugins by tag
   */
  getByTag(tag: string): Promise<PluginRegistryEntry[]>;

  /**
   * Check for updates to installed plugins
   */
  checkUpdates(
    installedPlugins: Record<string, string>,
  ): Promise<Record<string, { current: string; latest: string }>>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  type: "static" | "http" | "custom";
  registryUrl?: string;
  cacheTtl?: number;
  localRegistryPath?: string;
  customProvider?: RegistryProvider;
}

/**
 * Factory for creating registry providers
 */
export class RegistryProviderFactory {
  private static defaultConfig: ProviderConfig = {
    type: "static",
    registryUrl:
      "https://raw.githubusercontent.com/sancus-project/sancus-cli/main/plugin-registry/registry.json",
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
  };

  private static currentConfig: ProviderConfig = { ...this.defaultConfig };
  private static currentProvider: RegistryProvider | null = null;

  /**
   * Set the configuration for the registry provider factory
   */
  static setConfig(config: Partial<ProviderConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...config };
    // Reset provider when config changes
    this.currentProvider = null;
  }

  /**
   * Get the current configuration
   */
  static getConfig(): ProviderConfig {
    return { ...this.currentConfig };
  }

  /**
   * Create or get the current provider instance
   */
  static create(): RegistryProvider {
    if (this.currentProvider) {
      return this.currentProvider;
    }

    const config = this.currentConfig;
    let provider: RegistryProvider;

    switch (config.type) {
      case "custom":
        if (!config.customProvider) {
          throw new Error(
            "Custom provider type requires customProvider in config",
          );
        }
        provider = config.customProvider;
        break;

      case "http":
        // Imported dynamically to avoid issues if fetch is not available
        // HttpRegistryProvider will be created in Phase 6.7
        throw new Error(
          "HTTP provider not yet implemented. Use 'static' or implement Phase 6.7.",
        );

      case "static":
      default:
        provider = new StaticRegistryProvider(
          config.registryUrl || this.defaultConfig.registryUrl!,
          config.cacheTtl || this.defaultConfig.cacheTtl!,
          config.localRegistryPath,
        );
    }

    this.currentProvider = provider;
    return this.currentProvider;
  }

  /**
   * Reset the provider (for testing)
   */
  static reset(): void {
    this.currentProvider = null;
    this.currentConfig = { ...this.defaultConfig };
  }
}
