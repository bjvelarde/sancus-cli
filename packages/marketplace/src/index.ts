/**
 * Sancus Marketplace
 * Community marketplace for plugins and frameworks
 */

export {
  ManifestManager,
  getManifestManager,
  resetManifestManager,
  type InstalledPlugin,
  type PluginManifest,
} from "./manifest-manager.js";

export {
  RegistryClient,
  getRegistryClient,
  resetRegistryClient,
  type PluginRegistryEntry,
  type SearchOptions,
} from "./registry-client.js";

export {
  installPlugin,
  uninstallPlugin,
  checkUpdates,
  upgradePlugin,
} from "./install.js";

export {
  RegistryProviderFactory,
  type RegistryProvider,
  type ProviderConfig,
} from "./providers/index.js";

export { StaticRegistryProvider } from "./providers/static-registry.js";
export { HttpRegistryProvider } from "./providers/http-registry.js";

export {
  checkPackageIntegrity,
  validateIntegrityFields,
  type IntegrityCheckResult,
} from "./integrity.js";

export {
  calculateSha256,
  verifySha256,
} from "./security/verify-integrity.js";
