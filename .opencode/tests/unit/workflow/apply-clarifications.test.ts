import { describe, expect, it } from "bun:test";

import { applyClarifications, type ClarificationAnswer } from "../../../src/workflow/apply-clarifications";

describe("apply-clarifications", () => {
  describe("placeholder replacement", () => {
    it("replaces single placeholder with answer and appends clarification section", () => {
      const content = "The feature should [NEEDS CLARIFICATION: be async or sync?]";
      const answers: ClarificationAnswer[] = [{ question: "be async or sync?", answer: "async" }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("The feature should async");
      expect(result).toContain("## Clarifications");
      expect(result).toContain("- Q: be async or sync? -> A: async");
    });

    it("replaces multiple placeholders with answers", () => {
      const content =
        "The API should [NEEDS CLARIFICATION: use REST or GraphQL?] and [NEEDS CLARIFICATION: require authentication?]";
      const answers: ClarificationAnswer[] = [
        { question: "use REST or GraphQL?", answer: "REST" },
        { question: "require authentication?", answer: "yes" },
      ];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("REST");
      expect(result).toContain("yes");
      expect(result).toContain("## Clarifications");
    });

    it("handles duplicate placeholders with same answer", () => {
      const content =
        "[NEEDS CLARIFICATION: what is the timeout?] and [NEEDS CLARIFICATION: what is the timeout?]";
      const answers: ClarificationAnswer[] = [{ question: "what is the timeout?", answer: "30s" }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("30s and 30s");
      expect(result).toContain("## Clarifications");
    });

    it("leaves content without placeholders unchanged when no answers", () => {
      const content = "This is a simple feature with no placeholders.";
      const answers: ClarificationAnswer[] = [];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toBe(content);
    });

    it("leaves unresolved placeholders in place", () => {
      const content = "The feature should [NEEDS CLARIFICATION: use what protocol?]";
      const answers: ClarificationAnswer[] = [{ question: "different question?", answer: "answer" }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("[NEEDS CLARIFICATION: use what protocol?]");
      expect(result).toContain("## Clarifications");
    });
  });

  describe("clarification section appending", () => {
    it("appends clarification section when none exists", () => {
      const content = "# Feature Spec\n\nSome description";
      const answers: ClarificationAnswer[] = [{ question: "Q1", answer: "A1" }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("## Clarifications");
      expect(result).toContain("### Session 2026-03-22");
      expect(result).toContain("- Q: Q1 -> A: A1");
    });

    it("appends to existing clarification section", () => {
      const content = "# Feature Spec\n\n## Clarifications\n\n### Session 2026-03-21\n- Q: Old -> A: Answer";
      const answers: ClarificationAnswer[] = [{ question: "New Question", answer: "New Answer" }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("### Session 2026-03-21");
      expect(result).toContain("- Q: Old -> A: Answer");
      expect(result).toContain("- Q: New Question -> A: New Answer");
    });

    it("does not append clarification section when answers is empty", () => {
      const content = "# Feature Spec\n\nSome description";
      const answers: ClarificationAnswer[] = [];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).not.toContain("## Clarifications");
      expect(result).toBe(content);
    });

    it("handles whitespace in question/answer", () => {
      const content = "[NEEDS CLARIFICATION:   question with spaces  ]";
      const answers: ClarificationAnswer[] = [{ question: "question with spaces", answer: "  answer  " }];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("answer");
      expect(result).toContain("## Clarifications");
    });
  });

  describe("edge cases", () => {
    it("handles empty content", () => {
      const result = applyClarifications("", [{ question: "Q", answer: "A" }], "2026-03-22");

      expect(result).toContain("## Clarifications");
    });

    it("handles content with only placeholder", () => {
      const result = applyClarifications("[NEEDS CLARIFICATION: Q]", [{ question: "Q", answer: "A" }], "2026-03-22");

      expect(result).toContain("A");
      expect(result).toContain("## Clarifications");
    });

    it("handles multiple answers on same question", () => {
      const content = "[NEEDS CLARIFICATION: Q1] and [NEEDS CLARIFICATION: Q2]";
      const answers: ClarificationAnswer[] = [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
      ];

      const result = applyClarifications(content, answers, "2026-03-22");

      expect(result).toContain("A1");
      expect(result).toContain("A2");
    });
  });
});