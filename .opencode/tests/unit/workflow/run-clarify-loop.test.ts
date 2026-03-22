import { describe, expect, it } from "bun:test";

import { runClarifyLoop } from "../../../src/workflow/run-clarify-loop";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("run-clarify-loop", () => {
  describe("runClarifyLoop", () => {
    it("returns PLAN phase when no ambiguities detected", () => {
      const content = "This is a simple feature with no ambiguities.";
      const result = runClarifyLoop(content);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toBe(content);
      expect(result.nextQuestion).toBeUndefined();
    });

    it("returns PLAN phase when content is empty", () => {
      const result = runClarifyLoop("");

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toBe("");
    });

    it("returns CLARIFY phase when ambiguity detected and no answers provided", () => {
      const content = "The feature should [NEEDS CLARIFICATION: be async or sync?]";
      const result = runClarifyLoop(content, []);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
      expect(result.nextQuestion).toBeDefined();
      expect(result.nextQuestion?.question).toBe("be async or sync?");
      expect(result.updatedContent).toBeUndefined();
    });

    it("returns CLARIFY phase when ambiguity detected and question not answered", () => {
      const content = "The feature should [NEEDS CLARIFICATION: be async or sync?]";
      const answers = [{ question: "different question?", answer: "answer" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
      expect(result.nextQuestion?.question).toBe("be async or sync?");
    });

    it("returns PLAN phase when all ambiguities are answered", () => {
      const content = "The feature should [NEEDS CLARIFICATION: be async or sync?]";
      const answers = [{ question: "be async or sync?", answer: "async" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toBeDefined();
      expect(result.updatedContent).toContain("async");
      expect(result.nextQuestion).toBeUndefined();
    });

    it("returns PLAN phase when multiple ambiguities all answered", () => {
      const content =
        "The API should [NEEDS CLARIFICATION: use REST or GraphQL?] and [NEEDS CLARIFICATION: require authentication?]";
      const answers = [
        { question: "use REST or GraphQL?", answer: "REST" },
        { question: "require authentication?", answer: "yes" },
      ];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toContain("REST");
      expect(result.updatedContent).toContain("yes");
    });

    it("returns CLARIFY phase when some ambiguities remain unanswered", () => {
      const content =
        "The API should [NEEDS CLARIFICATION: use REST or GraphQL?] and [NEEDS CLARIFICATION: require authentication?]";
      const answers = [{ question: "use REST or GraphQL?", answer: "REST" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
      expect(result.nextQuestion?.question).toBe("require authentication?");
    });

    it("applies clarifications and returns updated content", () => {
      const content = "The feature should [NEEDS CLARIFICATION: timeout value?]";
      const answers = [{ question: "timeout value?", answer: "30s" }];
      const result = runClarifyLoop(content, answers);

      expect(result.updatedContent).toBeDefined();
      expect(result.updatedContent).toContain("30s");
      expect(result.updatedContent).not.toContain("[NEEDS CLARIFICATION:");
    });

    it("handles duplicate questions in content", () => {
      const content =
        "[NEEDS CLARIFICATION: what is the timeout?] and [NEEDS CLARIFICATION: what is the timeout?]";
      const answers = [{ question: "what is the timeout?", answer: "30s" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toContain("30s");
    });

    it("handles whitespace in question matching", () => {
      const content = "[NEEDS CLARIFICATION:   question with spaces  ]";
      const answers = [{ question: "question with spaces", answer: "answer" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.updatedContent).toContain("answer");
    });
  });

  describe("edge cases", () => {
    it("handles empty answers array (no answers provided)", () => {
      const content = "[NEEDS CLARIFICATION: Q?]";
      const result = runClarifyLoop(content, []);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    });

    it("handles content with only clarification marker", () => {
      const content = "[NEEDS CLARIFICATION: Q?]";
      const result = runClarifyLoop(content, [{ question: "Q?", answer: "A" }]);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("returns correct phase when multiple questions and partial answers", () => {
      const content =
        "[NEEDS CLARIFICATION: Q1?] [NEEDS CLARIFICATION: Q2?] [NEEDS CLARIFICATION: Q3?]";
      const answers = [{ question: "Q1?", answer: "A1" }];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
      expect(result.nextQuestion?.question).toBe("Q2?");
    });

    it("returns PLAN when Q2 and Q3 answered but Q1 not answered", () => {
      const content =
        "[NEEDS CLARIFICATION: Q1?] [NEEDS CLARIFICATION: Q2?] [NEEDS CLARIFICATION: Q3?]";
      const answers = [
        { question: "Q2?", answer: "A2" },
        { question: "Q3?", answer: "A3" },
      ];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
      expect(result.nextQuestion?.question).toBe("Q1?");
    });

    it("returns PLAN when all questions answered in different order", () => {
      const content =
        "[NEEDS CLARIFICATION: Q1?] [NEEDS CLARIFICATION: Q2?] [NEEDS CLARIFICATION: Q3?]";
      const answers = [
        { question: "Q3?", answer: "A3" },
        { question: "Q1?", answer: "A1" },
        { question: "Q2?", answer: "A2" },
      ];
      const result = runClarifyLoop(content, answers);

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });
  });
});