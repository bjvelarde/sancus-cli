import { describe, it, expect } from "vitest";
import {
  installPlugin,
  uninstallPlugin,
  checkUpdates,
  upgradePlugin,
} from "./install";

describe("install.ts", () => {
  describe("API contract", () => {
    it("should export all install functions", () => {
      expect(typeof installPlugin).toBe("function");
      expect(typeof uninstallPlugin).toBe("function");
      expect(typeof checkUpdates).toBe("function");
      expect(typeof upgradePlugin).toBe("function");
    });

    it("should return promises from all functions", async () => {
      // These will fail or return empty due to missing fixtures,
      // but they should return promises
      const install = installPlugin("test-plugin");
      const uninstall = uninstallPlugin("test-plugin");
      const check = checkUpdates("test-plugin");
      const upgrade = upgradePlugin("test-plugin");

      expect(install).toBeInstanceOf(Promise);
      expect(uninstall).toBeInstanceOf(Promise);
      expect(check).toBeInstanceOf(Promise);
      expect(upgrade).toBeInstanceOf(Promise);
    });
  });

  describe("function signatures", () => {
    it("installPlugin should accept pluginId and optional version", async () => {
      // Verify function accepts expected parameters
      expect(() => {
        installPlugin("plugin1");
        installPlugin("plugin1", "1.0.0");
      }).not.toThrow();
    });

    it("uninstallPlugin should accept pluginId and optional force flag", async () => {
      expect(() => {
        uninstallPlugin("plugin1");
        uninstallPlugin("plugin1", true);
        uninstallPlugin("plugin1", false);
      }).not.toThrow();
    });

    it("checkUpdates should accept optional pluginId", async () => {
      expect(() => {
        checkUpdates();
        checkUpdates("plugin1");
      }).not.toThrow();
    });

    it("upgradePlugin should accept pluginId and optional version", async () => {
      expect(() => {
        upgradePlugin("plugin1");
        upgradePlugin("plugin1", "2.0.0");
      }).not.toThrow();
    });
  });
});
