import { describe, it, expect } from "vitest";
import * as marketplace from "./index";

describe("@sancus/marketplace exports", () => {
  it("should export RegistryClient", () => {
    expect(marketplace.RegistryClient).toBeDefined();
    expect(typeof marketplace.RegistryClient).toBe("function");
  });

  it("should export ManifestManager", () => {
    expect(marketplace.ManifestManager).toBeDefined();
    expect(typeof marketplace.ManifestManager).toBe("function");
  });

  it("should export install functions", () => {
    expect(marketplace.installPlugin).toBeDefined();
    expect(marketplace.uninstallPlugin).toBeDefined();
    expect(marketplace.checkUpdates).toBeDefined();
    expect(marketplace.upgradePlugin).toBeDefined();
  });

  it("should export RegistryProviderFactory", () => {
    expect(marketplace.RegistryProviderFactory).toBeDefined();
    expect(marketplace.RegistryProviderFactory.create).toBeDefined();
    expect(marketplace.RegistryProviderFactory.setConfig).toBeDefined();
    expect(marketplace.RegistryProviderFactory.getConfig).toBeDefined();
    expect(marketplace.RegistryProviderFactory.reset).toBeDefined();
  });

  it("should export provider implementations", () => {
    expect(marketplace.StaticRegistryProvider).toBeDefined();
    expect(marketplace.HttpRegistryProvider).toBeDefined();
  });
});

describe("marketplace package versions and compatibility", () => {
  it("should have consistent API across all exports", () => {
    // Verify that the public API is stable
    const requiredExports = [
      "RegistryClient",
      "ManifestManager",
      "installPlugin",
      "uninstallPlugin",
      "checkUpdates",
      "upgradePlugin",
      "RegistryProviderFactory",
      "StaticRegistryProvider",
      "HttpRegistryProvider",
    ];

    requiredExports.forEach((exportName) => {
      expect(marketplace).toHaveProperty(exportName);
    });
  });
});
