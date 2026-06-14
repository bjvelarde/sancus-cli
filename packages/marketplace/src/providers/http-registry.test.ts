import { describe, it, expect, beforeEach } from "vitest";
import { HttpRegistryProvider } from "./http-registry";

describe("HttpRegistryProvider", () => {
  let provider: HttpRegistryProvider;

  beforeEach(() => {
    provider = new HttpRegistryProvider();
  });

  describe("Phase 6.7 stub methods", () => {
    it("should throw not-implemented for getRegistry", async () => {
      await expect(provider.getRegistry()).rejects.toThrow(
        "not implemented yet",
      );
    });

    it("should throw not-implemented for getPlugin", async () => {
      await expect(provider.getPlugin("plugin1")).rejects.toThrow(
        "not implemented yet",
      );
    });

    it("should throw not-implemented for search", async () => {
      await expect(provider.search({})).rejects.toThrow("not implemented yet");
    });

    it("should throw not-implemented for listPlugins", async () => {
      await expect(provider.listPlugins()).rejects.toThrow(
        "not implemented yet",
      );
    });

    it("should throw not-implemented for checkUpdates", async () => {
      await expect(provider.checkUpdates("plugin1")).rejects.toThrow(
        "not implemented yet",
      );
    });
  });

  describe("Phase 6.7 implementation guidance", () => {
    it("should be ready for remote marketplace.sancus.dev API", () => {
      // Document expected API when implemented in Phase 6.7
      expect(provider).toHaveProperty("getRegistry");
      expect(provider).toHaveProperty("getPlugin");
      expect(provider).toHaveProperty("search");
      expect(provider).toHaveProperty("listPlugins");
      expect(provider).toHaveProperty("checkUpdates");
    });
  });
});
