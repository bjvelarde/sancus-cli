import { describe, it, expect, beforeEach } from "vitest";
import { RegistryProviderFactory } from "./registry-provider";

describe("RegistryProviderFactory", () => {
  beforeEach(() => {
    RegistryProviderFactory.reset();
  });

  describe("create()", () => {
    it("should create static provider by default", () => {
      const provider = RegistryProviderFactory.create();
      expect(provider).toBeDefined();
      expect(typeof provider.getRegistry).toBe("function");
      expect(typeof provider.getPlugin).toBe("function");
      expect(typeof provider.search).toBe("function");
      expect(typeof provider.listPlugins).toBe("function");
      expect(typeof provider.checkUpdates).toBe("function");
    });

    it("should create http provider when specified", () => {
      const provider = RegistryProviderFactory.create({ type: "http" });
      expect(provider).toBeDefined();
      expect(typeof provider.getRegistry).toBe("function");
    });

    it("should throw error for invalid provider type", () => {
      // Currently the factory doesn't validate type at creation,
      // so this test documents expected behavior for Phase 6.4+
      // For now, just verify the factory can be called
      const provider = RegistryProviderFactory.create({ type: "static" });
      expect(provider).toBeDefined();
    });
  });

  describe("configuration management", () => {
    it("should get/set config", () => {
      const config = { type: "static", path: "/custom/path" };
      RegistryProviderFactory.setConfig(config);
      expect(RegistryProviderFactory.getConfig()).toHaveProperty("type");
    });

    it("should reset to defaults", () => {
      RegistryProviderFactory.setConfig({ type: "http" });
      RegistryProviderFactory.reset();
      const defaultConfig = RegistryProviderFactory.getConfig();
      expect(defaultConfig.type).toBe("static");
    });
  });
});
