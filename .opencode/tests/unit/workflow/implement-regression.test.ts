import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { discoverCommands } from "../../../src/plugin/command-registry";
import { loadWorkflowContext } from "../../../src/workflow/context-loader";

describe("implement command regression", () => {
  describe("US1: /implement retains execution metadata", () => {
    it("implement command has build agent", () => {
      const commands = discoverCommands(process.cwd());
      const entry = commands.get("implement");

      expect(entry).toBeDefined();
      expect(entry!.agent).toBe("build");
    });

    it("implement command has scripts metadata with prerequisite check", () => {
      const commands = discoverCommands(process.cwd());
      const entry = commands.get("implement");

      expect(entry).toBeDefined();
      expect(entry!.scripts).toBeDefined();
      expect(entry!.scripts!.sh).toContain("check-prerequisites.sh");
      expect(entry!.scripts!.sh).toContain("--require-tasks");
    });

    it("implement command has description referencing tasks.md execution", () => {
      const commands = discoverCommands(process.cwd());
      const entry = commands.get("implement");

      expect(entry).toBeDefined();
      expect(entry!.description).toContain("tasks.md");
    });

    it("speckit.implement command also has scripts metadata", () => {
      const commands = discoverCommands(process.cwd());
      const entry = commands.get("speckit.implement");

      expect(entry).toBeDefined();
      expect(entry!.scripts).toBeDefined();
      expect(entry!.scripts!.sh).toContain("check-prerequisites.sh");
    });
  });

  describe("US2: /implement context loader returns tasks and plan as required", () => {
    it("loadWorkflowContext marks tasksExists when tasks.md is present", () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-impl-test-"));
      const featureRoot = path.join(repoRoot, "specs/feat-example");
      mkdirSync(featureRoot, { recursive: true });
      mkdirSync(path.join(repoRoot, ".specify"));
      writeFileSync(path.join(featureRoot, "tasks.md"), "# tasks\n");
      writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

      const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-example" });

      expect(context.artifacts.tasksExists).toBe(true);
      expect(context.artifacts.planExists).toBe(true);
    });

    it("loadWorkflowContext marks tasksExists false when tasks.md is absent", () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-impl-test-"));
      const featureRoot = path.join(repoRoot, "specs/feat-example");
      mkdirSync(featureRoot, { recursive: true });
      mkdirSync(path.join(repoRoot, ".specify"));
      writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

      const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-example" });

      expect(context.artifacts.tasksExists).toBe(false);
      expect(context.artifacts.planExists).toBe(true);
    });
  });
});
