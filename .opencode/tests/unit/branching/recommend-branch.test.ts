import { describe, expect, it } from "bun:test";

import {
  BRANCH_INTENT,
  inferBranchPrefix,
  recommendBranch,
} from "../../../src/branching/recommend-branch";
import { BRANCH_PREFIX } from "../../../src/branching/prefixes";

describe("recommend-branch", () => {
  describe("BRANCH_INTENT", () => {
    it("contains all expected intents", () => {
      expect(BRANCH_INTENT.INIT).toBe("init");
      expect(BRANCH_INTENT.FIX).toBe("fix");
      expect(BRANCH_INTENT.REFACTOR).toBe("refactor");
      expect(BRANCH_INTENT.TEST).toBe("test");
      expect(BRANCH_INTENT.FEAT).toBe("feat");
    });
  });

  describe("inferBranchPrefix", () => {
    it("returns INIT for bootstrap/initialize/setup keywords", () => {
      expect(inferBranchPrefix("bootstrap the project")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("initialize repository")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("setup CI pipeline")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("scaffold new feature")).toBe(BRANCH_PREFIX.INIT);
    });

    it("returns FIX for bug/fix/repair keywords", () => {
      expect(inferBranchPrefix("fix login bug")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("repair broken build")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("correct validation error")).toBe(BRANCH_PREFIX.FIX);
    });

    it("returns REFACTOR for refactor/cleanup keywords", () => {
      expect(inferBranchPrefix("refactor authentication module")).toBe(BRANCH_PREFIX.REFACTOR);
      expect(inferBranchPrefix("restructure codebase")).toBe(BRANCH_PREFIX.REFACTOR);
      expect(inferBranchPrefix("cleanup unused code")).toBe(BRANCH_PREFIX.REFACTOR);
    });

    it("returns TEST for test/coverage keywords", () => {
      expect(inferBranchPrefix("add tests for user module")).toBe(BRANCH_PREFIX.TEST);
      expect(inferBranchPrefix("improve test coverage")).toBe(BRANCH_PREFIX.TEST);
      expect(inferBranchPrefix("add spec for API")).toBe(BRANCH_PREFIX.TEST);
    });

    it("returns FEAT for default case", () => {
      expect(inferBranchPrefix("add user authentication")).toBe(BRANCH_PREFIX.FEAT);
      expect(inferBranchPrefix("implement dark mode")).toBe(BRANCH_PREFIX.FEAT);
    });

    it("is case insensitive", () => {
      expect(inferBranchPrefix("FIX this bug")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("Add new feature")).toBe(BRANCH_PREFIX.FEAT);
    });
  });

  describe("recommendBranch", () => {
    it("returns complete recommendation with prefix, shortName, and branchName", () => {
      const result = recommendBranch("create user authentication");
      expect(result.prefix).toBe(BRANCH_PREFIX.FEAT);
      expect(result.shortName).toBeTruthy();
      expect(result.branchName).toContain("feat-");
    });

    it("shortName is cleaned and limited to 3 segments", () => {
      const result = recommendBranch("create the new user authentication feature for the application");
      const segments = result.shortName.split("-");
      expect(segments.length).toBeLessThanOrEqual(3);
    });

    it("branchName combines prefix and shortName", () => {
      const result = recommendBranch("fix critical bug");
      expect(result.branchName).toBe(`${result.prefix}-${result.shortName}`);
    });

    it("recommends correct prefix for init", () => {
      const result = recommendBranch("initialize the repository");
      expect(result.prefix).toBe(BRANCH_PREFIX.INIT);
    });

    it("recommends correct prefix for fix", () => {
      const result = recommendBranch("fix the login bug");
      expect(result.prefix).toBe(BRANCH_PREFIX.FIX);
    });
  });
});