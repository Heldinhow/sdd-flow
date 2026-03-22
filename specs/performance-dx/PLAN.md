# Performance & DX - Technical Plan

## Performance Issues

| File | Issue | Fix |
|------|-------|-----|
| `detect-active-workspace.ts` | N+1 file stats | Use single readdir with stat |
| `detect-active-workspace.ts` | Multiple execSync | Batch git commands |
| `merge-managed-assets.ts` | Full file read for comparison | Size/mtime check first |
| `approval-state.ts` | No file locking | Atomic writes |

## DX Improvements

| Feature | Description |
|---------|-------------|
| Progress indicators | Show % complete for long ops |
| Caching | Memoize expensive operations |
| Batch operations | Run independent tasks in parallel |

## Verification

```bash
cd .opencode && bun test
# Performance benchmarks
```
