import { describe, expect, it } from "bun:test";

import { ARTIFACT_KIND, WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("session-state", () => {
  describe("WORKFLOW_PHASE", () => {
    it("contains all expected phases", () => {
      expect(WORKFLOW_PHASE.INIT).toBe("init");
      expect(WORKFLOW_PHASE.SPECIFY).toBe("specify");
      expect(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL).toBe("waiting_spec_approval");
      expect(WORKFLOW_PHASE.CLARIFY).toBe("clarify");
      expect(WORKFLOW_PHASE.PLAN).toBe("plan");
      expect(WORKFLOW_PHASE.WAITING_PLAN_APPROVAL).toBe("waiting_plan_approval");
      expect(WORKFLOW_PHASE.TASKS).toBe("tasks");
      expect(WORKFLOW_PHASE.COMPLETE).toBe("complete");
    });

    it("has 8 phases", () => {
      expect(Object.keys(WORKFLOW_PHASE)).toHaveLength(8);
    });
  });

  describe("ARTIFACT_KIND", () => {
    it("contains all expected artifact kinds", () => {
      expect(ARTIFACT_KIND.SPEC).toBe("spec");
      expect(ARTIFACT_KIND.PLAN).toBe("plan");
      expect(ARTIFACT_KIND.TASKS).toBe("tasks");
    });

    it("has 3 artifact kinds", () => {
      expect(Object.keys(ARTIFACT_KIND)).toHaveLength(3);
    });
  });
});