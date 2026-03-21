import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { detectRepoState } from "../../../src/init/detect-repo-state";
import { buildManagedAssetManifest } from "../../../src/init/managed-assets";
import { MERGE_ACTION, createMergePlan } from "../../../src/init/merge-managed-assets";
import { runInit } from "../../../src/init/run-init";

const repoRoot = path.resolve(import.meta.dir, "../../../..");

describe("repo initialization modules", () => {
  it("builds a managed asset manifest for the unified workflow", () => {
    const manifest = buildManagedAssetManifest(repoRoot);
    const relativePaths = manifest.map((asset) => asset.relativePath);

    expect(relativePaths).toContain(".opencode/command/sdd.md");
    expect(relativePaths).toContain(".opencode/plugins/sdd.ts");
    expect(relativePaths).toContain(".specify/scripts/bash/create-new-feature.sh");
    expect(relativePaths).toContain("AGENTS.md");
  });

  it("detects when a repository still needs initialization", () => {
    const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-init-"));
    const manifest = buildManagedAssetManifest(repoRoot);
    const state = detectRepoState(targetRoot, manifest);

    expect(state.needsInitialization).toBe(true);
    expect(state.missingAssets.length).toBeGreaterThan(0);
    expect(state.presentAssets.length).toBe(0);
  });

  it("creates a non-destructive merge plan for existing custom assets", () => {
    const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-init-"));
    const customCommandPath = path.join(targetRoot, ".opencode/command/sdd.md");
    mkdirSync(path.dirname(customCommandPath), { recursive: true });
    writeFileSync(customCommandPath, "custom command\n");

    const manifest = buildManagedAssetManifest(repoRoot);
    const plan = createMergePlan(targetRoot, manifest);

    expect(
      plan.actions.find((action) => action.relativePath === ".opencode/command/sdd.md")?.action,
    ).toBe(MERGE_ACTION.REVIEW);
    expect(plan.actions.some((action) => action.action === MERGE_ACTION.ADD)).toBe(true);
  });

  it("copies missing managed assets without overwriting existing ones", async () => {
    const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-init-"));
    const customCommandPath = path.join(targetRoot, ".opencode/command/sdd.md");
    mkdirSync(path.dirname(customCommandPath), { recursive: true });
    writeFileSync(customCommandPath, "custom command\n");

    const result = runInit({ sourceRoot: repoRoot, targetRoot });

    expect(result.addedAssets.length).toBeGreaterThan(0);
    expect(result.reviewAssets).toContain(".opencode/command/sdd.md");
    expect(result.nextRecommendation).toContain("/sdd");
    expect(await Bun.file(path.join(targetRoot, ".specify/templates/spec-template.md")).exists()).toBe(true);
    expect(await Bun.file(customCommandPath).text()).toBe("custom command\n");
  });
});
