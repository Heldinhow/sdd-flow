import { describe, expect, it } from "bun:test";
import path from "node:path";

import { orchestratePlanning } from "../../../src/workflow/orchestrate-planning";
import { BRANCH_PREFIX } from "../../../src/branching/prefixes";

describe("orchestrate-planning", () => {
  describe("orchestratePlanning", () => {
    it("returns an array of three command descriptors", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add dark mode",
        shortName: "dark-mode",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("first command is create-new-feature", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add dark mode",
        shortName: "dark-mode",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[0].scriptPath).toContain("create-new-feature.sh");
      expect(result[0].args).toContain("add dark mode");
      expect(result[0].args).toContain("feat");
      expect(result[0].args).toContain("dark-mode");
    });

    it("second command is setup-plan", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add dark mode",
        shortName: "dark-mode",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[1].scriptPath).toContain("setup-plan.sh");
    });

    it("third command is check-prerequisites with tasks required", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add dark mode",
        shortName: "dark-mode",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[2].scriptPath).toContain("check-prerequisites.sh");
      expect(result[2].args).toContain("--require-tasks");
      expect(result[2].args).toContain("--include-tasks");
    });

    it("each command has correct env setup", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add dark mode",
        shortName: "dark-mode",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      for (const cmd of result) {
        expect(cmd.env).toHaveProperty("SPECIFY_REPO_ROOT");
        expect(cmd.env.SPECIFY_REPO_ROOT).toBe("/test/repo");
      }
    });

    it("includes feature description in first command args", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "implement user authentication",
        shortName: "user-auth",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[0].args).toContain("implement user authentication");
    });

    it("includes short name in first command args", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "add feature",
        shortName: "my-feature",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[0].args).toContain("--short-name");
      expect(result[0].args).toContain("my-feature");
    });

    it("includes branch prefix in first command args", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "fix bug",
        shortName: "login-bug",
        branchPrefix: BRANCH_PREFIX.FIX,
      });

      expect(result[0].args).toContain("--type");
      expect(result[0].args).toContain("fix");
    });

    it("handles different branch prefixes", () => {
      const prefixes = [
        BRANCH_PREFIX.FEAT,
        BRANCH_PREFIX.FIX,
        BRANCH_PREFIX.REFACTOR,
        BRANCH_PREFIX.TEST,
        BRANCH_PREFIX.INIT,
      ];

      for (const prefix of prefixes) {
        const result = orchestratePlanning({
          repoRoot: "/test/repo",
          featureDescription: "test feature",
          shortName: "test",
          branchPrefix: prefix,
        });

        expect(result[0].args).toContain(prefix);
      }
    });

    it("returns correct CommandDescriptor structure", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "test",
        shortName: "test",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      for (const cmd of result) {
        expect(cmd).toHaveProperty("scriptPath");
        expect(cmd).toHaveProperty("args");
        expect(cmd).toHaveProperty("env");
        expect(typeof cmd.scriptPath).toBe("string");
        expect(Array.isArray(cmd.args)).toBe(true);
        expect(typeof cmd.env).toBe("object");
      }
    });

    it("sets up plan command with --json flag", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "test",
        shortName: "test",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[1].args).toContain("--json");
    });

    it("check-prerequisites includes --json flag", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "test",
        shortName: "test",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[2].args).toContain("--json");
    });
  });

  describe("edge cases", () => {
    it("handles empty feature description", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "",
        shortName: "test",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result).toHaveLength(3);
      expect(result[0].args).toContain("");
    });

    it("handles special characters in feature description", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "fix: handle [edge] case <properly>",
        shortName: "edge-case",
        branchPrefix: BRANCH_PREFIX.FIX,
      });

      expect(result).toHaveLength(3);
      expect(result[0].args).toContain("fix: handle [edge] case <properly>");
    });

    it("handles short names with hyphens and underscores", () => {
      const result = orchestratePlanning({
        repoRoot: "/test/repo",
        featureDescription: "test",
        shortName: "my_test-feature",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      expect(result[0].args).toContain("my_test-feature");
    });

    it("handles absolute repo root path", () => {
      const absPath = "/absolute/path/to/repo";
      const result = orchestratePlanning({
        repoRoot: absPath,
        featureDescription: "test",
        shortName: "test",
        branchPrefix: BRANCH_PREFIX.FEAT,
      });

      for (const cmd of result) {
        expect(cmd.scriptPath).toStartWith(absPath);
      }
    });
  });
});