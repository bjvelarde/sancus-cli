import { RegistryProvider } from "./registry-provider.js";
import { RegistryClient } from "../registry-client.js";
import { PluginRegistryEntry, SearchOptions } from "../registry-client.js";

/**
 * Static registry provider
 * Reads from static JSON files (local or cached from GitHub)
 */
export class StaticRegistryProvider implements RegistryProvider {
  private client: RegistryClient;

  constructor(
    registryUrl: string = "https://raw.githubusercontent.com/sancus-project/sancus-cli/main/plugin-registry/registry.json",
    cacheTtl: number = 24 * 60 * 60 * 1000,
    localRegistryPath?: string,
  ) {
    this.client = new RegistryClient(registryUrl, cacheTtl, localRegistryPath);
  }

  async getRegistry(
    forceRefresh?: boolean,
  ): Promise<Record<string, PluginRegistryEntry>> {
    return this.client.getRegistry(forceRefresh);
  }

  async getPlugin(id: string): Promise<PluginRegistryEntry | null> {
    return this.client.getPlugin(id);
  }

  async listPlugins(): Promise<PluginRegistryEntry[]> {
    return this.client.listPlugins();
  }

  async search(options: SearchOptions): Promise<PluginRegistryEntry[]> {
    return this.client.search(options);
  }

  async getFeatured(limit?: number): Promise<PluginRegistryEntry[]> {
    return this.client.getFeatured(limit);
  }

  async getByCategory(category: string): Promise<PluginRegistryEntry[]> {
    return this.client.getByCategory(category);
  }

  async getByTag(tag: string): Promise<PluginRegistryEntry[]> {
    return this.client.getByTag(tag);
  }

  async checkUpdates(
    installedPlugins: Record<string, string>,
  ): Promise<Record<string, { current: string; latest: string }>> {
    return this.client.checkUpdates(installedPlugins);
  }
}
