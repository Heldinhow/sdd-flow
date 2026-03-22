import { describe, expect, it } from "bun:test";

import { detectAmbiguity, type ClarificationRequest } from "../../../src/workflow/detect-ambiguity";

describe("detect-ambiguity", () => {
  describe("detectAmbiguity", () => {
    it("detects single clarification marker", () => {
      const content = "The feature should [NEEDS CLARIFICATION: be async or sync?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].marker).toBe("[NEEDS CLARIFICATION: be async or sync?]");
      expect(result[0].question).toBe("be async or sync?");
    });

    it("detects multiple clarification markers", () => {
      const content =
        "The API should [NEEDS CLARIFICATION: use REST or GraphQL?] and [NEEDS CLARIFICATION: require authentication?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe("use REST or GraphQL?");
      expect(result[1].question).toBe("require authentication?");
    });

    it("trims whitespace from question", () => {
      const content = "[NEEDS CLARIFICATION:   question with spaces  ]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("question with spaces");
    });

    it("returns empty array when no clarification markers", () => {
      const content = "This is a simple feature with no markers.";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(0);
    });

    it("returns empty array for empty string", () => {
      const result = detectAmbiguity("");

      expect(result).toHaveLength(0);
    });

    it("handles content with only clarification marker", () => {
      const result = detectAmbiguity("[NEEDS CLARIFICATION: what is the timeout?]");

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("what is the timeout?");
    });

    it("handles duplicate clarification markers", () => {
      const content =
        "[NEEDS CLARIFICATION: Q1] and [NEEDS CLARIFICATION: Q1]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe("Q1");
      expect(result[1].question).toBe("Q1");
    });

    it("stops at first closing bracket in nested content", () => {
      const content = "[NEEDS CLARIFICATION: what about [nested] brackets?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("what about [nested");
    });

    it("handles special characters in question", () => {
      const content = "[NEEDS CLARIFICATION: should we use @ decorators or #private fields?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("should we use @ decorators or #private fields?");
    });

    it("handles multiline content", () => {
      const content = `# Feature Spec

The feature should [NEEDS CLARIFICATION: support offline mode?]

## Implementation`;
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("support offline mode?");
    });
  });

  describe("ClarificationRequest type", () => {
    it("returns correct type structure", () => {
      const result = detectAmbiguity("[NEEDS CLARIFICATION: test question?]");

      expect(result[0]).toHaveProperty("marker");
      expect(result[0]).toHaveProperty("question");
      expect(typeof result[0].marker).toBe("string");
      expect(typeof result[0].question).toBe("string");
    });

    it("marker contains full original string", () => {
      const content = "[NEEDS CLARIFICATION: test?]";
      const result = detectAmbiguity(content);

      expect(result[0].marker).toBe(content);
    });
  });

  describe("edge cases", () => {
    it("handles marker at start of content", () => {
      const content = "[NEEDS CLARIFICATION: first?] rest";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("first?");
    });

    it("handles marker at end of content", () => {
      const content = "rest [NEEDS CLARIFICATION: last?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("last?");
    });

    it("handles multiple markers on same line", () => {
      const content = "[NEEDS CLARIFICATION: Q1?] [NEEDS CLARIFICATION: Q2?]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(2);
    });

    it("ignores malformed markers", () => {
      const content = "[NEEDS CLARIFICATION: Q1] and [MALFORMED: Q2]";
      const result = detectAmbiguity(content);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("Q1");
    });
  });
});