# Plan: AGENTS.md as Primary Reference

## High-Level Summary

Make `AGENTS.md` the primary development guidelines, removing automatic constitution.md creation from init flow. Constitution only created explicitly via `/speckit.constitution`.

## Changes

### 1. Update `managed-assets.ts`

**File**: `.opencode/src/init/managed-assets.ts`

The constitution.md should NOT be auto-created during init. It should only exist when explicitly filled.

```typescript
// Remove or comment out:
// SPECIFY_MEMORY: ".specify/memory/constitution.md",

// Keep:
// GUIDE: "AGENTS.md",
```

**Rationale**: The memory folder can still exist for other purposes, but constitution specifically should not be auto-generated as a blank template.

### 2. Update `command/sdd.md`

**File**: `.opencode/command/sdd.md`

Remove the line about auto-creating constitution.md:

```markdown
# Remove or comment:
# - Create `.specify/memory/constitution.md` from the template if it does not exist
```

### 3. Update `command/speckit.analyze.md`

**File**: `.opencode/command/speckit.analyze.md`

Change the reference from constitution-first to AGENTS.md-first:

```markdown
# Before:
- Load `.specify/memory/constitution.md` for principle validation

# After:
- Load `AGENTS.md` for active development guidelines
- Constitution (.specify/memory/constitution.md) is optional — only validate against it if:
  a) The file exists
  b) It contains actual filled principles (not just [BRACKETED_PLACEHOLDERS])
```

### 4. Verify AGENTS.md Completeness

**File**: `AGENTS.md`

Ensure AGENTS.md contains all core conventions needed for development guidance. Currently it has:
- Active technologies
- Build/test commands
- Project layout
- TypeScript conventions
- Plugin architecture
- Testing conventions
- Git branch naming
- SDD workflow commands
- Recent changes

This appears complete for current needs.

## Files to Modify

| File | Change |
|------|--------|
| `.opencode/src/init/managed-assets.ts` | Remove SPECIFY_MEMORY constitution reference |
| `.opencode/command/sdd.md` | Remove constitution creation from init instructions |
| `.opencode/command/speckit.analyze.md` | Update to check AGENTS.md first, constitution optional |

## Dependencies

None — these changes are independent and do not require prior work.

## Verification

1. After changes, `/sdd init` should NOT create `.specify/memory/constitution.md`
2. `/speckit.constitution` still works when explicitly invoked
3. `/speckit.analyze` reads AGENTS.md for guidelines
4. If constitution.md exists with real content, it still gets validated

## Risk

Low — this is a clarification of existing behavior, not a breaking change. Constitution creation via `/speckit.constitution` remains intact.
