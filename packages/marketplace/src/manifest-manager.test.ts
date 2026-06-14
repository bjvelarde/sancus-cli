import { describe, it, expect } from "vitest";
import { ManifestManager } from "./manifest-manager";

describe("ManifestManager", () => {
  it("should be instantiable", () => {
    const manager = new ManifestManager();
    expect(manager).toBeDefined();
  });

  describe("API contract", () => {
    it("should have all required methods", () => {
      const manager = new ManifestManager();
      const requiredMethods = [
        "getInstalled",
        "getEnabled",
        "getPlugin",
        "install",
        "uninstall",
        "enable",
        "disable",
        "updateVersion",
      ];

      requiredMethods.forEach((method) => {
        expect(manager).toHaveProperty(method);
        expect(typeof manager[method as keyof ManifestManager]).toBe(
          "function",
        );
      });
    });

    it("should return promises from all methods", async () => {
      const manager = new ManifestManager();

      expect(manager.getInstalled()).toBeInstanceOf(Promise);
      expect(manager.getEnabled()).toBeInstanceOf(Promise);
      expect(manager.getPlugin("test")).toBeInstanceOf(Promise);
      expect(manager.install("test", "1.0.0")).toBeInstanceOf(Promise);
      expect(manager.uninstall("test")).toBeInstanceOf(Promise);
      expect(manager.enable("test")).toBeInstanceOf(Promise);
      expect(manager.disable("test")).toBeInstanceOf(Promise);
      expect(manager.updateVersion("test", "2.0.0")).toBeInstanceOf(Promise);
    });
  });
});
