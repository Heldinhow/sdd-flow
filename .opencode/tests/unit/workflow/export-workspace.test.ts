import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { exportWorkspace } from "../../../src/workflow/export-workspace";

describe("export-workspace", () => {
  let testRoot: string;

  beforeEach(() => {
    testRoot = mkdtempSync(path.join(tmpdir(), "sdd-export-"));
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe("exportWorkspace", () => {
    it("returns error when workspace does not exist", async () => {
      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "non-existent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("returns error when workspace has no files", async () => {
      const workspaceDir = path.join(testRoot, "specs", "empty-feature");
      mkdirSync(workspaceDir, { recursive: true });

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "empty-feature",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("no files");
    });

    it("exports workspace successfully with spec.md and plan.md", async () => {
      const workspaceDir = path.join(testRoot, "specs", "test-feature");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Test Spec");
      writeFileSync(path.join(workspaceDir, "plan.md"), "# Test Plan");

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "test-feature",
      });

      expect(result.success).toBe(true);
      expect(result.bundlePath).toBeTruthy();
      expect(result.manifest.version).toBe("1.0");
      expect(result.manifest.featureName).toBe("test-feature");
      expect(result.manifest.artifacts).toContain("spec.md");
      expect(result.manifest.artifacts).toContain("plan.md");
      expect(result.manifest.totalSize).toBeGreaterThan(0);

      // Verify bundle file exists
      expect(existsSync(result.bundlePath)).toBe(true);

      // Verify manifest file exists
      const manifestPath = result.bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json";
      expect(existsSync(manifestPath)).toBe(true);

      // Cleanup
      unlinkSync(result.bundlePath);
      unlinkSync(manifestPath);
    });

    it("exports workspace with nested directories", async () => {
      const workspaceDir = path.join(testRoot, "specs", "nested-feature");
      const checklistsDir = path.join(workspaceDir, "checklists");
      mkdirSync(checklistsDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Nested Spec");
      writeFileSync(path.join(checklistsDir, "testing.md"), "- [ ] test item");

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "nested-feature",
      });

      expect(result.success).toBe(true);
      expect(result.manifest.artifacts).toContain("spec.md");
      expect(result.manifest.artifacts).toContain("checklists/testing.md");

      // Cleanup
      unlinkSync(result.bundlePath);
      unlinkSync(result.bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("skips .git and node_modules directories", async () => {
      const workspaceDir = path.join(testRoot, "specs", "skip-dirs-feature");
      const gitDir = path.join(workspaceDir, ".git");
      const nodeModulesDir = path.join(workspaceDir, "node_modules");
      mkdirSync(gitDir, { recursive: true });
      mkdirSync(nodeModulesDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Skip Dirs Spec");
      writeFileSync(path.join(gitDir, "config"), "git config");
      writeFileSync(path.join(nodeModulesDir, "package.json"), "{}");

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "skip-dirs-feature",
      });

      expect(result.success).toBe(true);
      expect(result.manifest.artifacts.some((a) => a.includes(".git"))).toBe(false);
      expect(result.manifest.artifacts.some((a) => a.includes("node_modules"))).toBe(false);

      // Cleanup
      unlinkSync(result.bundlePath);
      unlinkSync(result.bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("uses custom output path when specified", async () => {
      const workspaceDir = path.join(testRoot, "specs", "custom-path-feature");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Custom Path Spec");

      const customPath = path.join(testRoot, "my-custom-bundle.tar.gz");

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "custom-path-feature",
        outputPath: customPath,
      });

      expect(result.success).toBe(true);
      expect(result.bundlePath).toBe(customPath);
      expect(existsSync(customPath)).toBe(true);

      // Cleanup
      unlinkSync(customPath);
      unlinkSync(customPath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("calculates totalSize correctly", async () => {
      const workspaceDir = path.join(testRoot, "specs", "size-feature");
      mkdirSync(workspaceDir, { recursive: true });
      const specContent = "# Spec Content\n".repeat(100);
      writeFileSync(path.join(workspaceDir, "spec.md"), specContent);

      const result = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "size-feature",
      });

      expect(result.success).toBe(true);
      expect(result.manifest.totalSize).toBeGreaterThan(0);

      // Verify size matches actual file size
      const specSize = statSync(path.join(workspaceDir, "spec.md")).size;
      expect(result.manifest.totalSize).toBe(specSize);

      // Cleanup
      unlinkSync(result.bundlePath);
      unlinkSync(result.bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });
  });
});
