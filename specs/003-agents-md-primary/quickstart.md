# Quickstart: AGENTS.md as Primary Reference

## Summary

After this change, the Spec Driven agent consults `AGENTS.md` for development guidelines. The constitution file (`.specify/memory/constitution.md`) is only created when explicitly requested via `/speckit.constitution`.

## What Changed

| Before | After |
|--------|-------|
| `/sdd init` auto-creates constitution.md | `/sdd init` does NOT create constitution.md |
| Analyze commands check constitution first | Analyze commands check AGENTS.md first |
| Blank constitution treated as governance | Constitution only exists when explicitly filled |

## Verification Commands

```bash
# After changes, verify init behavior
/sdd init
# Should NOT create .specify/memory/constitution.md

# Verify AGENTS.md is consulted
/speckit.analyze
# Should reference AGENTS.md for guidelines

# Constitution still works when explicitly requested
/speckit.constitution
# Opens interactive constitution creation flow
```

## Files Modified

1. `.opencode/src/init/managed-assets.ts` — removed constitution from auto-tracking
2. `.opencode/command/sdd.md` — updated init instructions
3. `.opencode/command/speckit.analyze.md` — updated to check AGENTS.md first

## No Breaking Changes

- Existing filled constitutions continue to work
- `/speckit.constitution` command unchanged
- All existing workflows preserved
