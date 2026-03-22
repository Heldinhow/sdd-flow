# Testing Infrastructure - Technical Plan

## Architecture

```
.opencode/
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/           # E2E tests
├── test-helpers/       # Shared test utilities
└── coverage/          # Coverage reports
```

## Files to Modify

| Area | Files |
|------|-------|
| Workflow tests | `tests/unit/workflow/*.test.ts` |
| CLI tests | `tests/unit/cli/*.test.ts` |
| Test helpers | `tests/helpers/*.ts` |

## Technical Decisions

1. **Test Framework**: Bun test (already in use)
2. **Coverage Tool**: Built-in Bun coverage
3. **Parallelization**: Use `[P]` marker for parallel tests

## Verification

```bash
cd .opencode && bun test --coverage
```
