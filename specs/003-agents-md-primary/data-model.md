# Data Model: AGENTS.md as Primary Reference

## Overview

This feature modifies how the SDD workflow manages development guidelines. No new data structures are introduced — the change is about which existing file is consulted for guidance.

## File Relationships

```
AGENTS.md (authoritative)
    ↓ consulted by
├── /sdd command (init, plan, clarify)
├── /speckit.analyze command
└── .opencode/src/workflow/context-loader.ts

.constitution.md (optional, explicit only)
    ↓ created by
└── /speckit.constitution command (not auto-created)
```

## Managed Asset Changes

### Before

```typescript
// .opencode/src/init/managed-assets.ts
const MANAGED_ASSET_ROOT = {
  SPECIFY_MEMORY: ".specify/memory/constitution.md",  // ← auto-tracked
  GUIDE: "AGENTS.md",
  // ...
};
```

### After

```typescript
// .opencode/src/init/managed-assets.ts
const MANAGED_ASSET_ROOT = {
  // constitution.md removed — only explicit via /speckit.constitution
  GUIDE: "AGENTS.md",
  // ...
};
```

## No New Types Required

This is a documentation/configuration change. No new TypeScript types, interfaces, or data structures needed.

## Backward Compatibility

- `/speckit.constitution` still works — users can still create constitution if needed
- Existing repositories with filled constitution continue to work
- Only new init calls are affected (won't auto-create blank constitution)
