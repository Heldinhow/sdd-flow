# Error Handling - Technical Plan

## Error Categories

| Level | Description | Action |
|-------|-------------|--------|
| CRITICAL | Data loss risk | Stop, backup, report |
| ERROR | Operation failed | Log, report, continue |
| WARNING | Potential issue | Log, continue |
| INFO | FYI | Log |

## Files to Modify

| File | Issue |
|------|-------|
| `approval-state.ts` | Silent JSON failure |
| `detect-active-workspace.ts` | execSync error handling |
| `.github/workflows/sdd-pr-check.yml` | Wrong exit codes |

## Technical Decisions

1. **Error Type**: Use discriminated unions over `throw`
2. **Logging**: Structured JSON logs with levels
3. **Recovery**: Create backups before destructive operations

## Verification

```bash
cd .opencode && bun test
```
