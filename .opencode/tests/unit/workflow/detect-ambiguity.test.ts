import { describe, expect, it } from "bun:test";

import { detectAmbiguity } from "../../../src/workflow/detect-ambiguity";

describe("detect-ambiguity", () => {
  it("detects a single clarification marker", () => {
    const requests = detectAmbiguity("Requirement [NEEDS CLARIFICATION: choose merge policy]");

    expect(requests).toHaveLength(1);
    expect(requests[0]?.question).toBe("choose merge policy");
    expect(requests[0]?.marker).toBe("[NEEDS CLARIFICATION: choose merge policy]");
  });

  it("detects multiple clarification markers", () => {
    const content =
      "Requirement [NEEDS CLARIFICATION: choose merge policy] and [NEEDS CLARIFICATION: authentication method]";
    const requests = detectAmbiguity(content);

    expect(requests).toHaveLength(2);
    expect(requests[0]?.question).toBe("choose merge policy");
    expect(requests[1]?.question).toBe("authentication method");
  });

  it("trims whitespace from question", () => {
    const requests = detectAmbiguity("[NEEDS CLARIFICATION:  spaced question  ]");

    expect(requests[0]?.question).toBe("spaced question");
  });

  it("returns empty array when no markers present", () => {
    const requests = detectAmbiguity("No markers here, just regular content.");

    expect(requests).toHaveLength(0);
  });

  it("handles markers with special characters in question", () => {
    const requests = detectAmbiguity("[NEEDS CLARIFICATION: API v2 or v3? (legacy support)]");

    expect(requests[0]?.question).toBe("API v2 or v3? (legacy support)");
  });

  it("returns empty array for empty string", () => {
    const requests = detectAmbiguity("");

    expect(requests).toHaveLength(0);
  });

  it("only matches the specific [NEEDS CLARIFICATION:...] format", () => {
    const requests = detectAmbiguity("[NEEDS INFO: something] and [NEEDS CLARIFICATION: real question]");

    expect(requests).toHaveLength(1);
    expect(requests[0]?.question).toBe("real question");
  });
});
