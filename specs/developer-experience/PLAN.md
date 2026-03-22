# Developer Experience - Technical Plan

## Issues to Fix

| File | Issue | Fix |
|------|-------|-----|
| `spec-driven-agent.ts:91` | Unsafe `as never` cast | Proper type guard |
| `command-registry.ts:189` | Unsafe `as never` cast | Proper type guard |
| `multi-repo-workspace.ts` | Unused exports | Remove or use |

## Documentation to Add

| File | Description |
|------|-------------|
| `CONTRIBUTING.md` | How to contribute |
| `docs/architecture.md` | System design |
| `docs/troubleshooting.md` | Common issues |

## Verification

```bash
cd .opencode && bun test
bunx tsc --noEmit
```
