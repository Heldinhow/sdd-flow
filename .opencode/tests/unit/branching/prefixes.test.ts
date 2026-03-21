import { describe, expect, it } from "bun:test";

import {
  BRANCH_PREFIX,
  buildBranchName,
  normalizeBranchPrefix,
} from "../../../src/branching/prefixes";

describe("branch prefixes", () => {
  it("normalizes supported prefixes", () => {
    expect(normalizeBranchPrefix("FEAT")).toBe(BRANCH_PREFIX.FEAT);
    expect(normalizeBranchPrefix("fix")).toBe(BRANCH_PREFIX.FIX);
  });

  it("builds branch names from a prefix and short name", () => {
    expect(buildBranchName(BRANCH_PREFIX.FEAT, "Unified SDD Agent")).toBe(
      "feat-unified-sdd-agent",
    );
  });

  it("rejects unsupported prefixes", () => {
    expect(() => normalizeBranchPrefix("docs")).toThrow(
      "Unsupported branch prefix",
    );
  });
});
