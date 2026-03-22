import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  loadMultiRepoWorkspace,
  loadMultiRepoConfig,
  createMultiRepoConfig,
  linkWorkspaceToRepos,
  getRepoRootForFeature,
  getAllFeaturePaths,
  getCurrentBranch,
} from "../../../src/workflow/multi-repo-workspace";

describe("multi-repo-workspace", () => {
  let testRoot: string;

  beforeEach(() => {
    testRoot = mkdtempSync(path.join(tmpdir(), "sdd-multirepo-"));
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe("loadMultiRepoConfig", () => {
    it("returns null when workspace.config.json does not exist", () => {
      const config = loadMultiRepoConfig(testRoot);
      expect(config).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      writeFileSync(path.join(testRoot, "workspace.config.json"), "not json");
      const config = loadMultiRepoConfig(testRoot);
      expect(config).toBeNull();
    });

    it("returns null for unsupported version", () => {
      writeFileSync(
        path.join(testRoot, "workspace.config.json"),
        JSON.stringify({ version: "2.0", primaryRepo: "primary", repos: [], linkedAt: "" }),
      );
      const config = loadMultiRepoConfig(testRoot);
      expect(config).toBeNull();
    });

    it("returns config for valid workspace.config.json", () => {
      const config = {
        version: "1.0" as const,
        primaryRepo: path.join(testRoot, "primary"),
        repos: [{ name: "primary", localPath: path.join(testRoot, "primary"), isPrimary: true }],
        linkedAt: new Date().toISOString(),
      };
      writeFileSync(path.join(testRoot, "workspace.config.json"), JSON.stringify(config));

      const loaded = loadMultiRepoConfig(testRoot);
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe("1.0");
      expect(loaded!.repos.length).toBe(1);
    });
  });

  describe("loadMultiRepoWorkspace", () => {
    it("creates single-repo context when no config exists", () => {
      const result = loadMultiRepoWorkspace({
        workspaceRoot: testRoot,
        primaryRepoRoot: path.join(testRoot, "primary"),
      });

      expect(result.isMultiRepo).toBe(false);
      expect(result.repos.size).toBe(1);
      expect(result.primaryRepo.name).toBe("primary");
    });

    it("creates multi-repo context when config has multiple repos", () => {
      createMultiRepoConfig(testRoot, path.join(testRoot, "primary"), [
        { name: "secondary", localPath: path.join(testRoot, "secondary") },
      ]);

      const result = loadMultiRepoWorkspace({
        workspaceRoot: testRoot,
        primaryRepoRoot: path.join(testRoot, "primary"),
      });

      expect(result.isMultiRepo).toBe(true);
      expect(result.repos.size).toBe(2);
    });
  });

  describe("createMultiRepoConfig", () => {
    it("creates config with primary repo only", () => {
      const primaryRoot = path.join(testRoot, "primary");
      mkdirSync(primaryRoot, { recursive: true });

      const config = createMultiRepoConfig(testRoot, primaryRoot);

      expect(config.version).toBe("1.0");
      expect(config.repos.length).toBe(1);
      expect(config.repos[0].isPrimary).toBe(true);
      expect(config.repos[0].name).toBe("primary");
    });

    it("creates config with additional repos", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const secondaryRoot = path.join(testRoot, "secondary");
      mkdirSync(primaryRoot, { recursive: true });
      mkdirSync(secondaryRoot, { recursive: true });

      const config = createMultiRepoConfig(testRoot, primaryRoot, [
        { name: "secondary", localPath: secondaryRoot },
      ]);

      expect(config.repos.length).toBe(2);
      expect(config.repos[0].isPrimary).toBe(true);
      expect(config.repos[1].isPrimary).toBe(false);
      expect(config.repos[1].name).toBe("secondary");
    });

    it("writes workspace.config.json to disk", () => {
      const primaryRoot = path.join(testRoot, "primary");
      mkdirSync(primaryRoot, { recursive: true });

      createMultiRepoConfig(testRoot, primaryRoot);

      const configPath = path.join(testRoot, "workspace.config.json");
      expect(readFileSync(configPath, "utf-8")).toBeTruthy();
    });
  });

  describe("getRepoRootForFeature", () => {
    it("returns workspaceRoot/specs/featureName in single-repo mode", () => {
      const result = getRepoRootForFeature(testRoot, "my-feature");
      expect(result).toBe(path.join(testRoot, "specs", "my-feature"));
    });

    it("returns correct path when feature exists in primary repo", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const featureRoot = path.join(primaryRoot, "specs", "my-feature");
      mkdirSync(featureRoot, { recursive: true });

      createMultiRepoConfig(testRoot, primaryRoot);

      const result = getRepoRootForFeature(testRoot, "my-feature");
      expect(result).toBe(featureRoot);
    });

    it("returns correct path when feature exists in secondary repo", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const secondaryRoot = path.join(testRoot, "secondary");
      const primaryFeature = path.join(primaryRoot, "specs", "other-feature");
      const secondaryFeature = path.join(secondaryRoot, "specs", "my-feature");
      mkdirSync(primaryFeature, { recursive: true });
      mkdirSync(secondaryFeature, { recursive: true });

      createMultiRepoConfig(testRoot, primaryRoot, [
        { name: "secondary", localPath: secondaryRoot },
      ]);

      const result = getRepoRootForFeature(testRoot, "my-feature");
      expect(result).toBe(secondaryFeature);
    });

    it("defaults to primary repo when feature not found in any repo", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const secondaryRoot = path.join(testRoot, "secondary");
      mkdirSync(path.join(primaryRoot, "specs"), { recursive: true });
      mkdirSync(path.join(secondaryRoot, "specs"), { recursive: true });

      createMultiRepoConfig(testRoot, primaryRoot, [
        { name: "secondary", localPath: secondaryRoot },
      ]);

      const result = getRepoRootForFeature(testRoot, "non-existent-feature");
      // Should default to primary repo path
      expect(result).toContain("primary");
    });
  });

  describe("getAllFeaturePaths", () => {
    it("returns empty array in single-repo mode", () => {
      const result = getAllFeaturePaths(testRoot, "my-feature");
      expect(result).toEqual([]);
    });

    it("returns paths for features that exist across repos", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const secondaryRoot = path.join(testRoot, "secondary");
      const primaryFeature = path.join(primaryRoot, "specs", "shared-feature");
      const secondaryFeature = path.join(secondaryRoot, "specs", "shared-feature");
      mkdirSync(primaryFeature, { recursive: true });
      mkdirSync(secondaryFeature, { recursive: true });

      createMultiRepoConfig(testRoot, primaryRoot, [
        { name: "secondary", localPath: secondaryRoot },
      ]);

      const result = getAllFeaturePaths(testRoot, "shared-feature");
      expect(result.length).toBe(2);
      expect(result.some((r) => r.repo === "primary")).toBe(true);
      expect(result.some((r) => r.repo === "secondary")).toBe(true);
    });
  });

  describe("linkWorkspaceToRepos", () => {
    it("creates multi-repo config from repo paths", () => {
      const primaryRoot = path.join(testRoot, "primary");
      const secondaryRoot = path.join(testRoot, "secondary");
      mkdirSync(primaryRoot, { recursive: true });
      mkdirSync(secondaryRoot, { recursive: true });

      const config = linkWorkspaceToRepos(testRoot, primaryRoot, [secondaryRoot]);

      expect(config.repos.length).toBe(2);
      expect(config.repos[0].isPrimary).toBe(true);
      expect(config.repos[1].isPrimary).toBe(false);
    });
  });
});
