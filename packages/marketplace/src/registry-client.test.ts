import { describe, it, expect } from "vitest";
import { RegistryClient } from "./registry-client";

describe("RegistryClient", () => {
  it("should be instantiable", () => {
    const client = new RegistryClient();
    expect(client).toBeDefined();
    expect(typeof client.getRegistry).toBe("function");
    expect(typeof client.getPlugin).toBe("function");
    expect(typeof client.search).toBe("function");
    expect(typeof client.listPlugins).toBe("function");
    expect(typeof client.checkUpdates).toBe("function");
  });

  describe("API contract", () => {
    it("should have all required methods", () => {
      const client = new RegistryClient();
      const requiredMethods = [
        "getRegistry",
        "getPlugin",
        "search",
        "listPlugins",
        "checkUpdates",
      ];

      requiredMethods.forEach((method) => {
        expect(client).toHaveProperty(method);
        expect(typeof client[method as keyof RegistryClient]).toBe("function");
      });
    });

    it("should return promises from all methods", async () => {
      const client = new RegistryClient();

      // These will return empty/null due to missing registry file, but should be promises
      const registry = client.getRegistry();
      const plugin = client.getPlugin("test");
      const search = client.search({});
      const list = client.listPlugins();
      const updates = client.checkUpdates("test");

      expect(registry).toBeInstanceOf(Promise);
      expect(plugin).toBeInstanceOf(Promise);
      expect(search).toBeInstanceOf(Promise);
      expect(list).toBeInstanceOf(Promise);
      expect(updates).toBeInstanceOf(Promise);
    });
  });
});
