# Research: Require Sequential Approval Between Spec, Plan, and Tasks

**Feature Branch**: `fix-sequential-sdd-approval`
**Date**: 2026-03-21

## Research Questions

### Q1: What in the current workflow makes the stages feel bundled together?

**Finding**: The command contract describes a logical order, but current guidance still emphasizes automatic task preparation and the router decides progression mostly from artifact existence.

**Evidence**:
- `.opencode/command/sdd.md` describes “automatic task preparation” and says tasks are generated once planning artifacts are complete
- `.opencode/src/workflow/phase-router.ts` advances from spec absence to plan absence to tasks absence without explicit approval states

**Decision**: Introduce mandatory approval checkpoints into the workflow contract and routing behavior.

---

### Q2: Where should approval state live for this change?

**Finding**: The approved design choice is option A: session-controlled approval, not a persisted approval artifact in the workspace.

**Evidence**:
- User explicitly chose option `A`

**Decision**: Keep approval state in session memory and make resume flows conservative when approval cannot be proven in the current session.

---

### Q3: What should be the exact stage boundaries?

**Finding**: The desired boundaries are `spec -> plan package -> tasks`, where each next stage uses the previous approved stage as its input reference.

**Evidence**:
- User request explicitly says one file should be used as the reference to generate the next
- Approved design requires spec approval before planning and plan approval before tasks

**Decision**: Treat `spec.md` as the required input to planning, and treat `plan.md` plus `research.md`, `data-model.md`, and `quickstart.md` as the required inputs to tasks.

---

### Q4: How should resume work without persisted approvals?

**Finding**: Since approvals are session-scoped, resume cannot safely assume prior approvals just because files exist.

**Evidence**:
- The current route input tracks artifact existence and clarifications, but not persistent approval markers
- Session-only approval was chosen intentionally for implementation simplicity

**Decision**: Resume should stop at the latest completed stage and ask for revalidation when current-session approval state is missing.

---

### Q5: What should remain unchanged?

**Finding**: The workflow must remain markdown-only in `Spec Driven`, continue to use clarification loops, and avoid destructive behavior.

**Evidence**:
- `.opencode/command/sdd.md` requires markdown-only planning outputs
- Existing command contract already treats clarification as a separate step for high-impact ambiguity

**Decision**: Add approval gates without broadening the agent into implementation or weakening clarification rules.

## Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Add mandatory session-scoped approval gates | Fixes eager progression without requiring new persisted approval files |
| Make resume conservative when approvals are unknown | Prevents accidental stage skipping |
| Use approved prior-stage artifacts as explicit inputs to next stage | Matches the user’s desired sequential planning model |
| Update both command contract and workflow routing | Prevents the behavior from depending only on prompt wording |

## Risks Identified

1. **Risk**: Session approval state is lost between interactions  
   **Mitigation**: Resume recommends revalidation instead of auto-progression

2. **Risk**: Users edit generated artifacts after approval  
   **Mitigation**: Recompute readiness and require reapproval when the approved stage changes materially

3. **Risk**: Command wording and router logic drift apart  
   **Mitigation**: Update both `sdd.md` and workflow routing tests together

## References

- `.opencode/command/sdd.md`
- `.opencode/src/workflow/phase-router.ts`
- `.opencode/src/workflow/run-guided-sdd.ts`
- `.opencode/src/workflow/session-state.ts`
