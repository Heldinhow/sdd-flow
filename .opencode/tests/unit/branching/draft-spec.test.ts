import { describe, expect, it } from "bun:test";

import { extractFeatureName, extractFromPrDescription, generateDraftSpec } from "../../../src/branching/draft-spec";

describe("draft-spec", () => {
  describe("extractFeatureName", () => {
    it("extracts feature name from feat prefix branch", () => {
      expect(extractFeatureName("feat-user-authentication")).toBe("User Authentication");
    });

    it("extracts feature name with underscores", () => {
      expect(extractFeatureName("feat_add_payment_gateway")).toBe("Add Payment Gateway");
    });

    it("extracts feature name from fix branch", () => {
      expect(extractFeatureName("fix-login-redirect")).toBe("Login Redirect");
    });

    it("extracts feature name with multiple segments", () => {
      expect(extractFeatureName("feat-user-profile-settings")).toBe("User Profile Settings");
    });

    it("handles empty branch name", () => {
      expect(extractFeatureName("")).toBe("");
    });

    it("handles branch with no recognized prefix", () => {
      expect(extractFeatureName("user-auth")).toBe("User Auth");
    });
  });

  describe("extractFromPrDescription", () => {
    it("extracts title and context from PR description", () => {
      const result = extractFromPrDescription("Add user authentication\n\nThis implements login and logout functionality.\n");

      expect(result.title).toBe("Add user authentication");
      expect(result.context).toContain("implements login and logout");
    });

    it("extracts acceptance criteria section", () => {
      const result = extractFromPrDescription(`
        Add user authentication

        Acceptance Criteria:
        - Users can log in with email and password
        - Sessions persist across page refreshes
        - Invalid credentials show error message
      `);

      expect(result.acceptanceCriteria).toHaveLength(3);
      expect(result.acceptanceCriteria[0]).toContain("log in with email and password");
    });

    it("extracts edge cases section", () => {
      const result = extractFromPrDescription(`
        Add user authentication

        Edge Cases:
        - Invalid email format
        - Password too short
        - Account locked after 3 attempts
      `);

      expect(result.edgeCases).toHaveLength(3);
      expect(result.edgeCases[0]).toContain("Invalid email format");
    });

    it("handles description with numbered acceptance criteria", () => {
      const result = extractFromPrDescription(`
        Feature title

        Acceptance Criteria:
        1. First criterion
        2. Second criterion
        3. Third criterion
      `);

      expect(result.acceptanceCriteria).toHaveLength(3);
    });

    it("returns empty arrays when no criteria found", () => {
      const result = extractFromPrDescription("Simple description without any criteria lists.");

      expect(result.acceptanceCriteria).toHaveLength(0);
      expect(result.edgeCases).toHaveLength(0);
    });
  });

  describe("generateDraftSpec", () => {
    it("generates draft spec from branch name only", () => {
      const result = generateDraftSpec({
        branchName: "feat-user-authentication",
      });

      expect(result.featureName).toBe("User Authentication");
      expect(result.draftSpecContent).toContain("User Authentication");
      expect(result.draftSpecContent).toContain("feat-user-authentication");
      expect(result.confidence).toBe("low");
    });

    it("generates draft spec from PR title", () => {
      const result = generateDraftSpec({
        branchName: "feat-auth",
        prTitle: "Add OAuth2 authentication",
      });

      expect(result.featureName).toBe("Add OAuth2 authentication");
      expect(result.description).toBe("Add OAuth2 authentication");
      expect(result.confidence).toBe("high");
    });

    it("prefers PR title over branch name", () => {
      const result = generateDraftSpec({
        branchName: "feat-add-feature",
        prTitle: "User Profile Management",
      });

      expect(result.featureName).toBe("User Profile Management");
      expect(result.description).toBe("User Profile Management");
    });

    it("includes detected intent in output", () => {
      const result = generateDraftSpec({
        branchName: "feat-user-login",
        prTitle: "Add login functionality",
      });

      expect(result.detectedIntent).toBe("Authentication & Security");
    });

    it("includes current date in draft spec", () => {
      const result = generateDraftSpec({
        branchName: "feat-new-feature",
      });

      const today = new Date().toISOString().split("T")[0];
      expect(result.draftSpecContent).toContain(`**Created**: ${today}`);
    });

    it("generates spec with acceptance criteria from PR description", () => {
      const result = generateDraftSpec({
        branchName: "feat-form",
        prTitle: "Contact Form",
        prDescription: `
          Contact Form Implementation

          Acceptance Criteria:
          - Form validates email format
          - Submit sends email
          - Success message shown after submit
        `,
      });

      expect(result.draftSpecContent).toContain("Form validates email format");
      expect(result.confidence).toBe("high");
    });

    it("generates spec with edge cases from PR description", () => {
      const result = generateDraftSpec({
        branchName: "feat-upload",
        prTitle: "File Upload",
        prDescription: `
          File Upload Feature

          Edge Cases:
          - File exceeds size limit
          - Network connection lost during upload
        `,
      });

      expect(result.draftSpecContent).toContain("File exceeds size limit");
      expect(result.draftSpecContent).toContain("Network connection lost during upload");
    });

    it("returns 'Untitled Feature' when all inputs are empty", () => {
      const result = generateDraftSpec({});

      expect(result.featureName).toBe("Untitled Feature");
      expect(result.confidence).toBe("medium");
    });
  });
});
