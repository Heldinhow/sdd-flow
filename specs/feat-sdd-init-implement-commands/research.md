# Research: SDD Init and Implement Commands

**Feature Branch**: `feat-sdd-init-implement-commands`
**Date**: 2026-03-21

## Research Questions

### Q1: How does the OpenCode handoff mechanism work?

**Finding**: OpenCode uses YAML frontmatter in command files with a `handoffs` key that specifies:
- `label`: Human-readable name for the handoff
- `agent`: Target agent (e.g., `default`, `speckit.tasks`)
- `prompt`: Context passed to the target agent

**Evidence**: Examined `.opencode/command/sdd.md`:
```yaml
handoffs:
  - label: Run Task Generation
    agent: speckit.tasks
    prompt: Generate task breakdown...
```

**Decision**: Use the same handoff pattern for `/sdd-init` and `/implement` commands, targeting `default` agent for full permissions.

---

### Q2: How does the existing `/sdd init` flow work?

**Finding**: The `/sdd` command has an initialization flow embedded in Step 3 of `sdd.md`:
- Detects if `.opencode/` and `.specify/` exist
- Uses non-destructive merge strategy
- Calls `check-prerequisites.sh --json --paths-only`
- Preserves user customizations

**Evidence**: Lines 87-104 in `sdd.md`:
```markdown
### Step 3: Repository Initialization Flow (when needed)

When the user invokes `/sdd init` or the system detects uninitialized repository state:
1. Detect current state
2. Plan the merge
3. Execute the merge
4. Report
5. Recommend next step
```

**Decision**: `/sdd-init` should follow the same pattern but as a standalone command with explicit checklist.

---

### Q3: How does `/speckit.constitution` create constitution interactively?

**Finding**: The constitution command (`.opencode/command/speckit.constitution.md`):
1. Loads `.specify/templates/constitution-template.md`
2. Identifies placeholder tokens like `[PROJECT_NAME]`, `[PRINCIPLE_X_NAME]`
3. Collects values from user or infers from repo context
4. Fills all placeholders
5. Writes to `.specify/memory/constitution.md`

**Evidence**: Lines 18-84 in `speckit.constitution.md` outline the full flow.

**Decision**: `/sdd-init` should embed the same interactive constitution creation as Phase 5 of its checklist.

---

### Q4: How does `/speckit.implement` execute tasks?

**Finding**: The implement command (`.opencode/command/speckit.implement.md`):
1. Runs `check-prerequisites.sh --json --require-tasks --include-tasks`
2. Validates tasks.md exists
3. Checks checklists status
4. Loads implementation context (tasks, plan, data-model, contracts, research, quickstart)
5. Executes tasks phase by phase
6. Marks completed tasks with `[X]`

**Evidence**: Lines 49-198 in `speckit.implement.md`.

**Decision**: `/implement` should delegate to the same logic with agent handoff.

---

### Q5: How does Spec Driven agent detect repo state?

**Finding**: The plugin (`.opencode/src/plugin/index.ts`) uses:
```typescript
function hasSddMarkers(directory: string): boolean {
  return existsSync(path.join(directory, ".specify")) && 
         existsSync(path.join(directory, "specs"));
}
```

**Evidence**: Lines 14-16 in `index.ts`.

**Decision**: Use the same detection in `buildSpecDrivenPrompt()` to show warning for uninitialized repos.

---

### Q6: What files does speckit create in a feature workspace?

**Finding**: The `.opencode/command/speckit.plan.md` creates:
- `plan.md` - Implementation plan
- `research.md` - Research decisions
- `data-model.md` - Data models (if applicable)
- `quickstart.md` - Quickstart guide
- `contracts/` - API contracts (if applicable)

**Evidence**: Line 131 in `sdd.md`:
```markdown
Generate plan.md, research.md, data-model.md, quickstart.md, and any relevant markdown contracts
```

**Decision**: For this feature, research.md is needed. data-model.md is NOT applicable (no data models involved).

---

## Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Use `default` agent handoff | Full permissions for file creation and code execution |
| Use existing detection logic | `hasSddMarkers()` already works correctly |
| Embed constitution flow | Reuse proven `/speckit.constitution` logic |
| Delegate to `/speckit.implement` | Proven task execution logic |
| Create `research.md` | Document research decisions |
| Skip `data-model.md` | No data entities in this feature |
| Load all artifacts in `/implement` | Uses research.md, quickstart.md, data-model.md as context |
| Auto-create artifacts in `/sdd` | Already implemented - just needs integration verification |

---

## Risks Identified

1. **Risk**: User runs `/sdd-init` twice
   - **Mitigation**: Non-destructive merge preserves existing files

2. **Risk**: `/implement` called without planning
   - **Mitigation**: Clear error message with guidance

3. **Risk**: Agent handoff fails
   - **Mitigation**: OpenCode handles gracefully, user sees command in history

---

## References

- `.opencode/command/sdd.md` - Main SDD workflow
- `.opencode/command/speckit.constitution.md` - Constitution creation
- `.opencode/command/speckit.implement.md` - Task execution
- `.opencode/src/plugin/spec-driven-agent.ts` - Agent configuration
- `.opencode/src/plugin/index.ts` - Plugin entrypoint and detection logic