# CLI Improvements - Technical Plan

## Architecture

```
cli/
├── sdd.ts                 # Main CLI entry point
├── commands/
│   ├── init.ts           # Init command
│   ├── workspaces.ts     # Workspace management
│   └── index.ts          # Command registry
└── lib/
    ├── script-resolver.ts   # Script resolution
    └── workspace-manager.ts  # Workspace management
```

## Files to Modify

| File | Changes |
|------|---------|
| `cli/sdd.ts` | Fix `--bootstrap` flag handling (line ~170) |
| `cli/sdd.ts` | Fix cmdWorkspaces dead code (lines ~225-249) |
| `cli/lib/script-resolver.ts` | Fix getScriptPath to return null when missing |

## Technical Decisions

1. **Error Handling**: Use `Result<T, E>` pattern instead of throwing
2. **Script Resolution**: Return `null | string` instead of invalid paths
3. **Workspace List**: Remove dead fallback code, use exec result directly

## Verification

```bash
cd .opencode && bun test
bunx tsc --noEmit
```
