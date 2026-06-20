import { describe, it, expect } from "vitest";
import {
  PluginMetadata,
  SancusPlugin,
  Finding,
  Severity,
  Confidence,
  PluginContext,
  PluginConfig,
  Logger,
  FileSystemUtils,
  ScannedFile,
} from "./types.js";

describe("Types", () => {
  describe("PluginMetadata", () => {
    it("should allow valid metadata", () => {
      const metadata: PluginMetadata = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        author: "Test Author",
        description: "A test plugin",
      };

      expect(metadata.id).toBe("test-plugin");
      expect(metadata.version).toBe("1.0.0");
    });

    it("should support optional fields", () => {
      const metadata: PluginMetadata = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        author: "Test Author",
        description: "A test plugin",
        repository: "https://github.com/test/repo",
        license: "MIT",
        keywords: ["test", "plugin"],
      };

      expect(metadata.repository).toBe("https://github.com/test/repo");
      expect(metadata.license).toBe("MIT");
      expect(metadata.keywords).toHaveLength(2);
    });

    it("should support B3 manifest fields", () => {
      const metadata: PluginMetadata = {
        id: "my-plugin",
        name: "My Plugin",
        version: "1.0.0",
        author: "Jane Dev",
        description: "Detects issues",
        sdkVersion: "0.2.0",
        engineCompatibility: ">=1.0.0 <2.0.0",
        capabilities: ["filesystem", "ast"],
        dependencies: ["@sancus/plugin-base"],
      };

      expect(metadata.sdkVersion).toBe("0.2.0");
      expect(metadata.engineCompatibility).toBe(">=1.0.0 <2.0.0");
      expect(metadata.capabilities).toEqual(["filesystem", "ast"]);
      expect(metadata.dependencies).toEqual(["@sancus/plugin-base"]);
    });

    it("should be valid with only required fields", () => {
      const metadata: PluginMetadata = {
        id: "minimal-plugin",
        name: "Minimal Plugin",
        version: "0.1.0",
        author: "Dev",
        description: "Minimal",
      };

      expect(metadata.id).toBe("minimal-plugin");
      expect(metadata.sdkVersion).toBeUndefined();
      expect(metadata.capabilities).toBeUndefined();
    });
  });

  describe("Finding", () => {
    it("should create a valid finding with required fields", () => {
      const finding: Finding = {
        type: "test-issue",
        severity: "high" as Severity,
        location: "file.ts:10",
        lineRange: "10",
        codeSnippet: "const x = 1;",
        confidence: "high" as Confidence,
        message: "Test issue found",
        recommendation: "Fix this issue",
      };

      expect(finding.type).toBe("test-issue");
      expect(finding.severity).toBe("high");
      expect(finding.confidence).toBe("high");
    });

    it("should support all severity levels", () => {
      const severities: Severity[] = [
        "critical",
        "high",
        "medium",
        "low",
        "info",
      ];

      severities.forEach((severity) => {
        const finding: Finding = {
          type: "test",
          severity,
          location: "file.ts:1",
          lineRange: "1",
          codeSnippet: "code",
          confidence: "high" as Confidence,
          message: "Test",
          recommendation: "Fix",
        };

        expect(finding.severity).toBe(severity);
      });
    });

    it("should support all confidence levels", () => {
      const confidences: Confidence[] = ["high", "medium", "low"];

      confidences.forEach((confidence) => {
        const finding: Finding = {
          type: "test",
          severity: "high" as Severity,
          location: "file.ts:1",
          lineRange: "1",
          codeSnippet: "code",
          confidence,
          message: "Test",
          recommendation: "Fix",
        };

        expect(finding.confidence).toBe(confidence);
      });
    });

    it("should support optional fields", () => {
      const finding: Finding = {
        type: "test-issue",
        severity: "high" as Severity,
        location: "file.ts:10",
        lineRange: "10",
        codeSnippet: "const x = 1;",
        confidence: "high" as Confidence,
        message: "Test issue found",
        recommendation: "Fix this issue",
        category: "Security",
        cvssScore: 7.5,
        metadata: { custom: "data" },
      };

      expect(finding.category).toBe("Security");
      expect(finding.cvssScore).toBe(7.5);
      expect(finding.metadata?.custom).toBe("data");
    });

    it("should support line ranges", () => {
      const singleLine: Finding = {
        type: "test",
        severity: "high" as Severity,
        location: "file.ts:10",
        lineRange: "10",
        codeSnippet: "code",
        confidence: "high" as Confidence,
        message: "Test",
        recommendation: "Fix",
      };

      const multiLine: Finding = {
        type: "test",
        severity: "high" as Severity,
        location: "file.ts:10",
        lineRange: "10-15",
        codeSnippet: "code",
        confidence: "high" as Confidence,
        message: "Test",
        recommendation: "Fix",
      };

      expect(singleLine.lineRange).toBe("10");
      expect(multiLine.lineRange).toBe("10-15");
    });
  });

  describe("SancusPlugin", () => {
    it("should require metadata and detect function", () => {
      const plugin: SancusPlugin = {
        metadata: {
          id: "test",
          name: "Test",
          version: "1.0.0",
          author: "Test",
          description: "Test plugin",
        },
        async detect() {
          return [];
        },
      };

      expect(plugin.metadata.id).toBe("test");
      expect(plugin.detect).toBeDefined();
    });

    it("should support optional hooks", () => {
      const plugin: SancusPlugin = {
        metadata: {
          id: "test",
          name: "Test",
          version: "1.0.0",
          author: "Test",
          description: "Test plugin",
        },
        files: ["**/*.ts"],
        async initialize() {},
        async detect() {
          return [];
        },
        async postScan(findings: Finding[]) {
          return findings;
        },
      };

      expect(plugin.files).toEqual(["**/*.ts"]);
      expect(plugin.initialize).toBeDefined();
      expect(plugin.postScan).toBeDefined();
    });
  });

  describe("ScannedFile", () => {
    it("should contain file metadata and content", () => {
      const file: ScannedFile = {
        path: "src/index.ts",
        content: 'console.log("hello");',
        lines: ['console.log("hello");'],
      };

      expect(file.path).toBe("src/index.ts");
      expect(file.content).toBe('console.log("hello");');
      expect(file.lines).toHaveLength(1);
    });

    it("should handle multiline content", () => {
      const file: ScannedFile = {
        path: "src/index.ts",
        content: "const x = 1;\nconst y = 2;\nreturn x + y;",
        lines: ["const x = 1;", "const y = 2;", "return x + y;"],
      };

      expect(file.lines).toHaveLength(3);
      expect(file.lines[0]).toBe("const x = 1;");
      expect(file.lines[2]).toBe("return x + y;");
    });
  });

  describe("PluginContext", () => {
    it("should provide logger, fs, and config", () => {
      const logger: Logger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      const fs: FileSystemUtils = {
        readFile: async () => "",
        fileExists: async () => false,
        getProjectRoot: () => "/",
      };

      const config: PluginConfig = {
        projectRoot: "/project",
        options: {},
      };

      const context: PluginContext = {
        logger,
        fs,
        config,
      };

      expect(context.logger).toBeDefined();
      expect(context.fs).toBeDefined();
      expect(context.config).toBeDefined();
      expect(context.config.projectRoot).toBe("/project");
    });
  });
});
