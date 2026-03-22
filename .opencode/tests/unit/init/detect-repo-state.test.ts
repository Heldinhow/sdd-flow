import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { detectRepoState } from "../../../src/init/detect-repo-state";
import type { ManagedAsset } from "../../../src/init/managed-assets";

describe("detect-repo-state", () => {
  describe("detectRepoState", () => {
    it("detects when all assets are present", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        mkdirSync(path.join(tempRoot, ".opencode"), { recursive: true });
        mkdirSync(path.join(tempRoot, ".opencode/skills/sdd-flow"), { recursive: true });
        mkdirSync(path.join(tempRoot, ".opencode/command"), { recursive: true });
        mkdirSync(path.join(tempRoot, ".specify"), { recursive: true });
        writeFileSync(path.join(tempRoot, ".opencode/command/sdd.md"), "# sdd\n");
        writeFileSync(path.join(tempRoot, ".opencode/skills/sdd-flow/SKILL.md"), "# skill\n");
        writeFileSync(path.join(tempRoot, "AGENTS.md"), "# agents\n");

        const mockAssets: ManagedAsset[] = [
          { relativePath: ".opencode/command/sdd.md", sourcePath: "/source/.opencode/command/sdd.md", group: "command" },
          { relativePath: ".opencode/skills/sdd-flow/SKILL.md", sourcePath: "/source/.opencode/skills/sdd-flow/SKILL.md", group: "skill" },
          { relativePath: "AGENTS.md", sourcePath: "/source/AGENTS.md", group: "guide" },
        ];

        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.needsInitialization).toBe(false);
        expect(result.missingAssets).toHaveLength(0);
        expect(result.presentAssets).toHaveLength(3);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("detects when some assets are missing", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        mkdirSync(path.join(tempRoot, ".opencode"), { recursive: true });
        mkdirSync(path.join(tempRoot, ".opencode/skills/sdd-flow"), { recursive: true });
        writeFileSync(path.join(tempRoot, ".opencode/skills/sdd-flow/SKILL.md"), "# skill\n");

        const mockAssets: ManagedAsset[] = [
          { relativePath: ".opencode/command/sdd.md", sourcePath: "/source/.opencode/command/sdd.md", group: "command" },
          { relativePath: ".opencode/skills/sdd-flow/SKILL.md", sourcePath: "/source/.opencode/skills/sdd-flow/SKILL.md", group: "skill" },
          { relativePath: "AGENTS.md", sourcePath: "/source/AGENTS.md", group: "guide" },
        ];

        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.needsInitialization).toBe(true);
        expect(result.missingAssets).toContain(".opencode/command/sdd.md");
        expect(result.missingAssets).toContain("AGENTS.md");
        expect(result.presentAssets).toHaveLength(1);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("detects .opencode directory presence", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        mkdirSync(path.join(tempRoot, ".opencode"), { recursive: true });

        const mockAssets: ManagedAsset[] = [
          { relativePath: ".opencode/command/sdd.md", sourcePath: "/source/.opencode/command/sdd.md", group: "command" },
        ];

        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.hasOpencode).toBe(true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("detects .specify directory presence", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        mkdirSync(path.join(tempRoot, ".specify"), { recursive: true });

        const mockAssets: ManagedAsset[] = [];

        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.hasSpecify).toBe(true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("detects AGENTS.md presence", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        writeFileSync(path.join(tempRoot, "AGENTS.md"), "# agents\n");

        const mockAssets: ManagedAsset[] = [];

        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.hasAgentsFile).toBe(true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("returns correct targetRoot", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-state-test-"));
      try {
        const mockAssets: ManagedAsset[] = [];
        const result = detectRepoState(tempRoot, mockAssets);
        expect(result.targetRoot).toBe(tempRoot);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });
  });
});
