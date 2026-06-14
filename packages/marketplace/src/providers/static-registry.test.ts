import { describe, it, expect, beforeEach } from "vitest";
import { StaticRegistryProvider } from "./static-registry";

describe("StaticRegistryProvider", () => {
  let provider: StaticRegistryProvider;

  beforeEach(() => {
    provider = new StaticRegistryProvider();
  });

  describe("API contract", () => {
    it("should have all required methods", () => {
      expect(typeof provider.getRegistry).toBe("function");
      expect(typeof provider.getPlugin).toBe("function");
      expect(typeof provider.search).toBe("function");
      expect(typeof provider.listPlugins).toBe("function");
      expect(typeof provider.checkUpdates).toBe("function");
    });

    it("should return promises from all methods", () => {
      expect(provider.getRegistry()).toBeInstanceOf(Promise);
      expect(provider.getPlugin("test")).toBeInstanceOf(Promise);
      expect(provider.search({})).toBeInstanceOf(Promise);
      expect(provider.listPlugins()).toBeInstanceOf(Promise);
      expect(provider.checkUpdates("test")).toBeInstanceOf(Promise);
    });
  });
});
