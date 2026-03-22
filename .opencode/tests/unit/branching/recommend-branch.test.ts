import { describe, expect, it } from "bun:test";

import { BRANCH_INTENT, inferBranchPrefix, recommendBranch } from "../../../src/branching/recommend-branch";
import { BRANCH_PREFIX } from "../../../src/branching/prefixes";

describe("recommend-branch", () => {
  describe("inferBranchPrefix", () => {
    it("infers INIT prefix for bootstrap/initialize/setup/scaffold keywords", () => {
      expect(inferBranchPrefix("bootstrap the project")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("initialize the repository")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("initialise the workspace")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("setup CI/CD")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("scaffold the application")).toBe(BRANCH_PREFIX.INIT);
    });

    it("infers FIX prefix for bug/fix/repair/correct keywords", () => {
      expect(inferBranchPrefix("fix the login bug")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("bug in the parser")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("repair the broken build")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("correct the validation")).toBe(BRANCH_PREFIX.FIX);
    });

    it("infers REFACTOR prefix for refactor/restructure/cleanup keywords", () => {
      expect(inferBranchPrefix("refactor the authentication module")).toBe(BRANCH_PREFIX.REFACTOR);
      expect(inferBranchPrefix("restructure the project layout")).toBe(BRANCH_PREFIX.REFACTOR);
      expect(inferBranchPrefix("cleanup the legacy code")).toBe(BRANCH_PREFIX.REFACTOR);
    });

    it("infers TEST prefix for test/coverage/spec keywords", () => {
      expect(inferBranchPrefix("add tests for the API")).toBe(BRANCH_PREFIX.TEST);
      expect(inferBranchPrefix("improve test coverage")).toBe(BRANCH_PREFIX.TEST);
      expect(inferBranchPrefix("add spec for the module")).toBe(BRANCH_PREFIX.TEST);
    });

    it("defaults to FEAT prefix for generic descriptions", () => {
      expect(inferBranchPrefix("add dark mode support")).toBe(BRANCH_PREFIX.FEAT);
      expect(inferBranchPrefix("implement user dashboard")).toBe(BRANCH_PREFIX.FEAT);
      expect(inferBranchPrefix("add new API endpoint")).toBe(BRANCH_PREFIX.FEAT);
    });

    it("is case-insensitive", () => {
      expect(inferBranchPrefix("FIX the bug")).toBe(BRANCH_PREFIX.FIX);
      expect(inferBranchPrefix("Refactor the code")).toBe(BRANCH_PREFIX.REFACTOR);
      expect(inferBranchPrefix("BUG in the system")).toBe(BRANCH_PREFIX.FIX);
    });

    it("matches substrings within words", () => {
      expect(inferBranchPrefix("setupfoo")).toBe(BRANCH_PREFIX.INIT);
      expect(inferBranchPrefix("testify")).toBe(BRANCH_PREFIX.TEST);
      expect(inferBranchPrefix("bugfixer")).toBe(BRANCH_PREFIX.FIX);
    });
  });

  describe("recommendBranch", () => {
    it("returns complete branch recommendation", () => {
      const result = recommendBranch("add user authentication");

      expect(result).toHaveProperty("prefix");
      expect(result).toHaveProperty("shortName");
      expect(result).toHaveProperty("branchName");
      expect(result.prefix).toBe(BRANCH_PREFIX.FEAT);
    });

    it("shortens names to max 3 segments", () => {
      const result = recommendBranch("add user authentication and authorization support");

      const segments = result.shortName.split("-");
      expect(segments.length).toBeLessThanOrEqual(3);
    });

    it("removes specified stop words from short name", () => {
      const result = recommendBranch("create a new user profile for the application");

      expect(result.shortName).not.toContain("create");
      expect(result.shortName).not.toContain("for");
      expect(result.shortName).not.toContain("the");
      expect(result.shortName).not.toContain("new");
    });

    it("builds correct branch name", () => {
      const result = recommendBranch("add dark mode");

      expect(result.branchName).toBe("feat-add-dark-mode");
    });

    it("throws on empty descriptions", () => {
      expect(() => recommendBranch("")).toThrow("Short name must contain at least one alphanumeric character");
    });

    it("produces lowercase branch names", () => {
      const result = recommendBranch("Add Dark Mode Support");

      expect(result.branchName).toBe(result.branchName.toLowerCase());
    });
  });

  describe("BRANCH_INTENT", () => {
    it("contains all expected branch intents", () => {
      expect(BRANCH_INTENT).toEqual({
        INIT: "init",
        FIX: "fix",
        REFACTOR: "refactor",
        TEST: "test",
        FEAT: "feat",
      });
    });
  });
});