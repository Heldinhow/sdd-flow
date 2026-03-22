import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { importWorkspace, readManifest, listWorkspaceBundles } from "../../../src/workflow/import-workspace";
import { exportWorkspace } from "../../../src/workflow/export-workspace";

describe("import-workspace", () => {
  let testRoot: string;

  beforeEach(() => {
    testRoot = mkdtempSync(path.join(tmpdir(), "sdd-import-"));
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe("readManifest", () => {
    it("returns null when manifest does not exist", () => {
      const result = readManifest("/non/existent/bundle.tar.gz");
      expect(result).toBeNull();
    });

    it("returns null for invalid JSON manifest", () => {
      const manifestPath = path.join(testRoot, "test.manifest.json");
      writeFileSync(manifestPath, "not json");

      const result = readManifest(path.join(testRoot, "test.tar.gz"));
      expect(result).toBeNull();
    });

    it("reads valid manifest", () => {
      const manifest = {
        version: "1.0" as const,
        exportedAt: new Date().toISOString(),
        featureName: "test-feature",
        artifacts: ["spec.md", "plan.md"],
        totalSize: 100,
      };
      const manifestPath = path.join(testRoot, "test.manifest.json");
      writeFileSync(manifestPath, JSON.stringify(manifest));

      const result = readManifest(path.join(testRoot, "test.tar.gz"));
      expect(result).not.toBeNull();
      expect(result!.featureName).toBe("test-feature");
      expect(result!.artifacts.length).toBe(2);
    });
  });

  describe("importWorkspace", () => {
    it("returns error when bundle does not exist", async () => {
      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: "/non/existent/bundle.tar.gz",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("returns error when workspace already exists and overwrite is false", async () => {
      // First create a workspace
      const workspaceDir = path.join(testRoot, "specs", "existing-feature");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Existing");

      // Create a bundle
      const bundlePath = path.join(testRoot, "existing-feature.sdd-bundle.tar.gz");
      const gzip = await import("node:zlib");
      const { createGzip } = gzip;
      const { createWriteStream } = await import("node:fs");
      const { pipeline } = await import("node:stream/promises");

      const wsDir = path.join(testRoot, "specs", "new-feature");
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(path.join(wsDir, "spec.md"), "# New");

      const exportResult = await exportWorkspace({
        repoRoot: testRoot,
        featureName: "new-feature",
        outputPath: bundlePath,
      });

      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: bundlePath,
        targetName: "existing-feature",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");

      // Cleanup
      unlinkSync(bundlePath);
      unlinkSync(bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("imports workspace successfully", async () => {
      // Create and export a workspace
      const sourceRoot = mkdtempSync(path.join(tmpdir(), "sdd-export-source-"));
      const workspaceDir = path.join(sourceRoot, "specs", "import-test-feature");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Import Test Spec");
      writeFileSync(path.join(workspaceDir, "plan.md"), "# Import Test Plan");

      const bundlePath = path.join(testRoot, "import-test-feature.sdd-bundle.tar.gz");
      const exportResult = await exportWorkspace({
        repoRoot: sourceRoot,
        featureName: "import-test-feature",
        outputPath: bundlePath,
      });

      expect(exportResult.success).toBe(true);

      // Now import it
      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: bundlePath,
      });

      expect(result.success).toBe(true);
      expect(result.importedAs).toBe("import-test-feature");
      expect(result.artifactsImported).toBeGreaterThan(0);

      // Verify imported files exist
      const importedSpec = path.join(testRoot, "specs", "import-test-feature", "spec.md");
      const importedPlan = path.join(testRoot, "specs", "import-test-feature", "plan.md");
      expect(existsSync(importedSpec)).toBe(true);
      expect(existsSync(importedPlan)).toBe(true);
      expect(readFileSync(importedSpec, "utf-8")).toBe("# Import Test Spec");

      // Cleanup
      rmSync(sourceRoot, { recursive: true, force: true });
      unlinkSync(bundlePath);
      unlinkSync(bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("imports with custom target name", async () => {
      // Create and export a workspace
      const sourceRoot = mkdtempSync(path.join(tmpdir(), "sdd-export-source-"));
      const workspaceDir = path.join(sourceRoot, "specs", "original-name");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Original Name");

      const bundlePath = path.join(testRoot, "original-name.sdd-bundle.tar.gz");
      await exportWorkspace({
        repoRoot: sourceRoot,
        featureName: "original-name",
        outputPath: bundlePath,
      });

      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: bundlePath,
        targetName: "renamed-feature",
      });

      expect(result.success).toBe(true);
      expect(result.importedAs).toBe("renamed-feature");

      // Verify files exist with new name
      const renamedSpec = path.join(testRoot, "specs", "renamed-feature", "spec.md");
      expect(existsSync(renamedSpec)).toBe(true);

      // Cleanup
      rmSync(sourceRoot, { recursive: true, force: true });
      unlinkSync(bundlePath);
      unlinkSync(bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("overwrites existing workspace when overwrite is true", async () => {
      // Create existing workspace
      const existingDir = path.join(testRoot, "specs", "overwrite-test");
      mkdirSync(existingDir, { recursive: true });
      writeFileSync(path.join(existingDir, "spec.md"), "# Old Content");

      // Create bundle with new content
      const sourceRoot = mkdtempSync(path.join(tmpdir(), "sdd-export-source-"));
      const workspaceDir = path.join(sourceRoot, "specs", "overwrite-test");
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# New Content");

      const bundlePath = path.join(testRoot, "overwrite-test.sdd-bundle.tar.gz");
      await exportWorkspace({
        repoRoot: sourceRoot,
        featureName: "overwrite-test",
        outputPath: bundlePath,
      });

      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: bundlePath,
        overwrite: true,
      });

      expect(result.success).toBe(true);
      expect(readFileSync(path.join(existingDir, "spec.md"), "utf-8")).toBe("# New Content");

      // Cleanup
      rmSync(sourceRoot, { recursive: true, force: true });
      unlinkSync(bundlePath);
      unlinkSync(bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });

    it("imports nested directory structure", async () => {
      const sourceRoot = mkdtempSync(path.join(tmpdir(), "sdd-export-source-"));
      const workspaceDir = path.join(sourceRoot, "specs", "nested-import");
      const checklistsDir = path.join(workspaceDir, "checklists");
      mkdirSync(checklistsDir, { recursive: true });
      writeFileSync(path.join(workspaceDir, "spec.md"), "# Nested Import");
      writeFileSync(path.join(checklistsDir, "testing.md"), "- [ ] test item");

      const bundlePath = path.join(testRoot, "nested-import.sdd-bundle.tar.gz");
      await exportWorkspace({
        repoRoot: sourceRoot,
        featureName: "nested-import",
        outputPath: bundlePath,
      });

      const result = await importWorkspace({
        repoRoot: testRoot,
        bundlePath: bundlePath,
      });

      expect(result.success).toBe(true);
      expect(existsSync(path.join(testRoot, "specs", "nested-import", "checklists", "testing.md"))).toBe(true);

      // Cleanup
      rmSync(sourceRoot, { recursive: true, force: true });
      unlinkSync(bundlePath);
      unlinkSync(bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json");
    });
  });

  describe("listWorkspaceBundles", () => {
    it("returns empty array when no bundles exist", () => {
      const result = listWorkspaceBundles(testRoot);
      expect(result).toEqual([]);
    });

    it("returns bundle files with correct extensions", () => {
      writeFileSync(path.join(testRoot, "feature1.sdd-bundle.tar.gz"), "");
      writeFileSync(path.join(testRoot, "feature2.sdd-bundle.tar.gz"), "");
      writeFileSync(path.join(testRoot, "feature3.sdd-bundle.zip"), "");
      writeFileSync(path.join(testRoot, "not-a-bundle.txt"), "");

      const result = listWorkspaceBundles(testRoot);

      expect(result.length).toBe(3);
      expect(result).toContain("feature1.sdd-bundle.tar.gz");
      expect(result).toContain("feature2.sdd-bundle.tar.gz");
      expect(result).toContain("feature3.sdd-bundle.zip");
    });
  });
});
