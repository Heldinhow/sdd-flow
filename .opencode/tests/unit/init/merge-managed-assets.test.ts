import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { MERGE_ACTION, createMergePlan } from "../../../src/init/merge-managed-assets";
import type { ManagedAsset } from "../../../src/init/managed-assets";

describe("merge-managed-assets", () => {
  describe("MERGE_ACTION", () => {
    it("contains all expected actions", () => {
      expect(MERGE_ACTION.ADD).toBe("add");
      expect(MERGE_ACTION.KEEP).toBe("keep");
      expect(MERGE_ACTION.REVIEW).toBe("review");
    });
  });

  describe("createMergePlan", () => {
    it("returns ADD action for new assets", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-merge-test-"));
      try {
        const mockAssets: ManagedAsset[] = [
          { relativePath: "AGENTS.md", sourcePath: "/source/AGENTS.md", group: "guide" },
        ];
        const plan = createMergePlan(tempRoot, mockAssets);
        expect(plan.actions).toHaveLength(1);
        expect(plan.actions[0].action).toBe("add");
        expect(plan.actions[0].relativePath).toBe("AGENTS.md");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("returns KEEP action when source and target are identical", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-merge-test-"));
      try {
        mkdirSync(path.join(tempRoot, "source"), { recursive: true });
        writeFileSync(path.join(tempRoot, "source", "AGENTS.md"), "# Agents\n");
        
        const mockAssets: ManagedAsset[] = [
          { relativePath: "AGENTS.md", sourcePath: path.join(tempRoot, "source/AGENTS.md"), group: "guide" },
        ];
        writeFileSync(path.join(tempRoot, "AGENTS.md"), "# Agents\n");
        
        const plan = createMergePlan(tempRoot, mockAssets);
        expect(plan.actions[0].action).toBe("keep");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("returns REVIEW action when source and target differ", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-merge-test-"));
      try {
        mkdirSync(path.join(tempRoot, "source"), { recursive: true });
        writeFileSync(path.join(tempRoot, "source", "AGENTS.md"), "# Source\n");
        
        const mockAssets: ManagedAsset[] = [
          { relativePath: "AGENTS.md", sourcePath: path.join(tempRoot, "source/AGENTS.md"), group: "guide" },
        ];
        writeFileSync(path.join(tempRoot, "AGENTS.md"), "# Target\n");
        
        const plan = createMergePlan(tempRoot, mockAssets);
        expect(plan.actions[0].action).toBe("review");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("populates sourcePath and targetPath correctly", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-merge-test-"));
      try {
        const mockAssets: ManagedAsset[] = [
          { relativePath: "AGENTS.md", sourcePath: "/source/AGENTS.md", group: "guide" },
        ];
        const plan = createMergePlan(tempRoot, mockAssets);
        expect(plan.actions[0].sourcePath).toContain("/source");
        expect(plan.actions[0].targetPath).toContain(tempRoot);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("handles multiple assets with different merge states", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-merge-test-"));
      try {
        mkdirSync(path.join(tempRoot, "source"), { recursive: true });
        writeFileSync(path.join(tempRoot, "source", "AGENTS.md"), "# Agents\n");
        
        const mockAssets: ManagedAsset[] = [
          { relativePath: "AGENTS.md", sourcePath: path.join(tempRoot, "source/AGENTS.md"), group: "guide" },
          { relativePath: "README.md", sourcePath: path.join(tempRoot, "source/README.md"), group: "guide" },
        ];
        // AGENTS.md exists and matches source, README.md doesn't exist
        writeFileSync(path.join(tempRoot, "AGENTS.md"), "# Agents\n");
        
        const plan = createMergePlan(tempRoot, mockAssets);
        expect(plan.actions).toHaveLength(2);
        expect(plan.actions.find(a => a.relativePath === "AGENTS.md")?.action).toBe("keep");
        expect(plan.actions.find(a => a.relativePath === "README.md")?.action).toBe("add");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });
  });
});
