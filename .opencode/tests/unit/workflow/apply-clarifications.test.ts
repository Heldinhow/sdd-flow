import { describe, expect, it } from "bun:test";

import { applyClarifications } from "../../../src/workflow/apply-clarifications";

describe("apply-clarifications", () => {
  it("replaces clarification marker with answer", () => {
    const result = applyClarifications(
      "Requirement [NEEDS CLARIFICATION: choose merge policy]",
      [{ question: "choose merge policy", answer: "non-destructive merge" }],
      "2026-03-22",
    );

    expect(result).toContain("non-destructive merge");
    expect(result).not.toContain("[NEEDS CLARIFICATION:");
  });

  it("appends clarifications section when none exists", () => {
    const result = applyClarifications(
      "# Feature Spec\n\nSome content",
      [{ question: "choice", answer: "option A" }],
      "2026-03-22",
    );

    expect(result).toContain("## Clarifications");
    expect(result).toContain("Q: choice -> A: option A");
    expect(result).toContain("Session 2026-03-22");
  });

  it("does not duplicate clarifications section if it already exists", () => {
    const result = applyClarifications(
      "# Feature Spec\n\n## Clarifications\n\n- Q: existing -> A: value",
      [{ question: "new question", answer: "new answer" }],
      "2026-03-22",
    );

    expect(result).toContain("## Clarifications");
    const clarificationsCount = (result.match(/## Clarifications/g) || []).length;
    expect(clarificationsCount).toBe(1);
    expect(result).toContain("Q: new question -> A: new answer");
  });

  it("returns content unchanged when answers array is empty", () => {
    const content = "# Spec\n\n[NEEDS CLARIFICATION: some question]";
    const result = applyClarifications(content, [], "2026-03-22");

    expect(result).toBe(content);
    expect(result).not.toContain("## Clarifications");
  });

  it("replaces multiple markers in sequence", () => {
    const result = applyClarifications(
      "First [NEEDS CLARIFICATION: q1] and second [NEEDS CLARIFICATION: q2]",
      [
        { question: "q1", answer: "a1" },
        { question: "q2", answer: "a2" },
      ],
      "2026-03-22",
    );

    expect(result).toContain("a1");
    expect(result).toContain("a2");
    // markers are removed from body
    expect(result).not.toContain("[NEEDS CLARIFICATION:");
    // markers are preserved in the clarifications log section (expected behavior)
  });

  it("does not replace if question does not match", () => {
    const result = applyClarifications(
      "[NEEDS CLARIFICATION: original question]",
      [{ question: "different question", answer: "my answer" }],
      "2026-03-22",
    );

    // original marker is preserved since no matching answer
    expect(result).toContain("[NEEDS CLARIFICATION: original question]");
    // different question appears in clarifications log
    expect(result).toContain("different question");
    expect(result).toContain("my answer");
  });

  it("includes session date in clarifications section", () => {
    const result = applyClarifications(
      "Content",
      [{ question: "q", answer: "a" }],
      "2026-03-22",
    );

    expect(result).toContain("Session 2026-03-22");
  });
});
