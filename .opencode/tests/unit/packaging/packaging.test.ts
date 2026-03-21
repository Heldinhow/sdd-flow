import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../../..");
const bundleRoot = path.join(packageRoot, "managed-assets");

const REQUIRED_COMMANDS = [
  "sdd.md",
  "sdd-init.md",
  "implement.md",
  "speckit.analyze.md",
  "speckit.checklist.md",
  "speckit.clarify.md",
  "speckit.constitution.md",
  "speckit.implement.md",
  "speckit.plan.md",
  "speckit.specify.md",
  "speckit.tasks.md",
  "speckit.taskstoissues.md",
] as const;

const REQUIRED_SPECIFY_ASSETS = [
  ".specify/scripts/bash/check-prerequisites.sh",
  ".specify/scripts/bash/common.sh",
  ".specify/scripts/bash/create-new-feature.sh",
  ".specify/scripts/bash/setup-plan.sh",
  ".specify/scripts/bash/update-agent-context.sh",
  ".specify/templates/agent-file-template.md",
  ".specify/templates/checklist-template.md",
  ".specify/templates/constitution-template.md",
  ".specify/templates/plan-template.md",
  ".specify/templates/spec-template.md",
  ".specify/templates/tasks-template.md",
] as const;

const REQUIRED_GUIDE_ASSETS = ["AGENTS.md"] as const;
const REQUIRED_SKILLS = [
  ".opencode/skills/sdd-flow/SKILL.md",
  ".opencode/skills/sdd-spec/SKILL.md",
  ".opencode/skills/sdd-plan/SKILL.md",
  ".opencode/skills/sdd-tasks/SKILL.md",
] as const;

describe("packaging verification", () => {
  describe("bundle contains all required scaffold assets", () => {
    for (const cmd of REQUIRED_COMMANDS) {
      it(`contains command file: ${cmd}`, () => {
        const cmdPath = path.join(bundleRoot, ".opencode", "command", cmd);
        expect(existsSync(cmdPath), `${cmdPath} must exist in bundle`).toBe(true);
      });
    }

    for (const asset of REQUIRED_SPECIFY_ASSETS) {
      it(`contains specify asset: ${asset}`, () => {
        const assetPath = path.join(bundleRoot, asset);
        expect(existsSync(assetPath), `${assetPath} must exist in bundle`).toBe(true);
      });
    }

    for (const guide of REQUIRED_GUIDE_ASSETS) {
      it(`contains guide: ${guide}`, () => {
        const guidePath = path.join(bundleRoot, guide);
        expect(existsSync(guidePath), `${guidePath} must exist in bundle`).toBe(true);
      });
    }

    for (const skill of REQUIRED_SKILLS) {
      it(`contains repo-local skill: ${skill}`, () => {
        const skillPath = path.join(bundleRoot, skill);
        expect(existsSync(skillPath), `${skillPath} must exist in bundle`).toBe(true);
      });
    }
  });

  describe("bundle command files have valid frontmatter", () => {
    for (const cmd of REQUIRED_COMMANDS) {
      it(`${cmd} has description in frontmatter`, () => {
        const cmdPath = path.join(bundleRoot, ".opencode", "command", cmd);
        const content = readFileSync(cmdPath, "utf8");
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        expect(frontmatterMatch).not.toBeNull();
        const descMatch = frontmatterMatch![1].match(/^description:\s*(.+)$/m);
        expect(descMatch).not.toBeNull();
      });
    }
  });

  describe("package.json files list includes the managed assets bundle", () => {
    it("includes managed-assets in publishable files", () => {
      const pkgPath = path.join(packageRoot, "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      expect(pkg.files).toContain("managed-assets/**/*");
    });

    it("does not install a global skill on postinstall", () => {
      const pkgPath = path.join(packageRoot, "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      expect(pkg.scripts.postinstall).toBeUndefined();
    });
  });

  describe("bundle has no extra nested managed-assets directories", () => {
    it("does not contain nested managed-assets inside the bundle", () => {
      const nestedManagedAssets = path.join(bundleRoot, "managed-assets");
      expect(existsSync(nestedManagedAssets)).toBe(false);
    });
  });

  describe("bundle command count matches expected SDD command set", () => {
    it("discovers exactly 12 command files from the bundle", () => {
      const cmdDir = path.join(bundleRoot, ".opencode", "command");
      const files = readdirSync(cmdDir).filter((f) => f.endsWith(".md"));
      expect(files.length).toBe(12);
    });
  });

  describe("bundle no longer ships the legacy artifact guard skill", () => {
    it("does not include sdd-artifact-guard", () => {
      const skillPath = path.join(bundleRoot, ".opencode", "skills", "sdd-artifact-guard", "SKILL.md");
      expect(existsSync(skillPath)).toBe(false);
    });
  });
});
