# Feature Specification: Performance Optimization

**Feature Branch**: `feat-performance-optimization`
**Created**: 2026-03-22
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - `discoverCommands` Called Once Per Plugin Lifecycle (Priority: P1)

As an OpenCode user, I want the plugin to scan the `.opencode/command/` directory only once
per session startup instead of on every command execution, so that command invocations do
not incur repeated filesystem scans.

**Why this priority**: In `src/plugin/index.ts`, `discoverCommands(projectRoot)` is called
inside the `"command.execute.before"` hook on every command execution via the `runner`
closure. For a repository with 15 command files (the current count), each execution calls
`readdirSync` + 15 `readFileSync` calls. The test `implement-regression.test.ts` already
documents this as a regression concern (the test was fixed in commit `4a7877a` to call
`discoverCommands` once).

**Independent Test**: Instrument `discoverCommands` with a call counter, trigger three
consecutive `"command.execute.before"` events, and assert the counter equals 1.

**Acceptance Scenarios**:

1. **Given** the plugin is initialised, **When** `"command.execute.before"` fires three
   times for different commands, **Then** `discoverCommands` is called exactly once.

2. **Given** the command directory contains 15 `.md` files, **When** the plugin starts,
   **Then** the total `readdirSync` calls for the command directory is exactly 1.

---

### User Story 2 - `loadApprovals` Avoids Redundant File Reads (Priority: P2)

As an OpenCode user working on a large feature with many agent turns, I want approval state
reads to be served from memory when the approvals file has not changed since the last read,
so that repeated `loadFeatureApproval` calls in the same session do not repeatedly hit the
filesystem.

**Why this priority**: `runGuidedSdd` calls `loadFeatureApproval` which calls `loadApprovals`
(a full file read + JSON parse) every time. During a multi-turn session, this is called on
every chat message. While the file is small, the pattern is inconsistent with how other
state is managed.

**Independent Test**: Call `loadFeatureApproval` ten times on the same file, count
`readFileSync` invocations (spy/mock), and assert the file is read at most once between
`saveFeatureApproval` calls.

**Acceptance Scenarios**:

1. **Given** `loadFeatureApproval` is called 5 times without intervening writes, **When**
   counting filesystem reads, **Then** the file is read exactly once.

2. **Given** `saveFeatureApproval` is called between two `loadFeatureApproval` calls,
   **When** counting reads, **Then** the file is re-read exactly once after the write.

3. **Given** the cache is primed and the file is externally modified (simulated by writing
   directly), **When** `loadFeatureApproval` is called, **Then** the caller may observe
   the stale cached value (cache-invalidation-on-write is sufficient; external writes are
   not in scope).

---

### User Story 3 - `detectActiveWorkspace` Exits Early on Branch Match (Priority: P2)

As a developer, I want `detectActiveWorkspace` to return immediately when the current git
branch matches a workspace directory, without running the more expensive `hasUncommittedChanges`
and `hasRecentEdits` git queries for all other workspaces.

**Why this priority**: The current implementation calls `getCurrentBranch` once, checks if
it matches, and returns early only if it does. But when it does not match, it calls
`hasUncommittedChanges` (runs `git status --porcelain`) for every workspace directory. In a
repo with 5 workspaces, a branch-name mismatch triggers 5 additional `execSync` calls. The
current early-return path is correct but the fallback scan is over-broad.

**Independent Test**: Create a repo with 5 workspace directories, none matching the current
branch. Assert that `hasUncommittedChanges` is called at most once (for the workspace with
changes), not once per workspace.

**Acceptance Scenarios**:

1. **Given** 5 workspaces exist and `getCurrentBranch` matches the second workspace,
   **When** `detectActiveWorkspace` is called, **Then** git is queried only once (for
   `getCurrentBranch`) and no `git status` calls are made.

2. **Given** no workspace matches the current branch and exactly one workspace has
   uncommitted changes, **When** `detectActiveWorkspace` is called, **Then** it returns
   that workspace without querying `hasRecentEdits`.

---

### User Story 4 - `exportWorkspace` Streams Files Without Buffering All Content (Priority: P3)

As a developer exporting a large feature workspace, I want `exportWorkspace` to write tar
entries as it reads each file rather than accumulating all file content in memory before
writing, so that exporting workspaces with large attached files does not spike memory usage.

**Why this priority**: The current implementation reads all file contents into `Buffer`
objects inside `createTarEntry` before writing. For typical SDD workspaces (three small
markdown files), this is not a problem. However, the `collectFiles` recursion includes all
files, and if a developer has stored large attachments in the workspace, the entire set is
held in memory simultaneously.

**Independent Test**: Export a workspace containing a 10 MB synthetic file and assert that
the peak RSS memory increase is less than 20 MB above baseline (measured via
`process.memoryUsage()`).

**Acceptance Scenarios**:

1. **Given** a workspace with a 10 MB file, **When** `exportWorkspace` is called, **Then**
   memory usage does not increase by more than 20 MB above the pre-call baseline.

2. **Given** a workspace with 50 small files, **When** exported, **Then** the resulting
   bundle is a valid tar.gz that `importWorkspace` can extract correctly.

---

### Edge Cases

- What if the approvals cache is read from two concurrent plugin instances?
- What if `discoverCommands` is called before the command directory is created (race
  condition during init)?
- What if the workspace directory changes between the start and end of `detectActiveWorkspace`?

## Requirements

- **FR-001**: `discoverCommands` MUST be called at most once per plugin lifecycle, not
  once per `"command.execute.before"` event.
- **FR-002**: `loadApprovals` SHOULD cache the parsed result in module scope and invalidate
  on `saveApprovals`.
- **FR-003**: `detectActiveWorkspace` MUST short-circuit after finding the first workspace
  with uncommitted changes, not scan all remaining workspaces.
- **FR-004**: `exportWorkspace` SHOULD write tar entries incrementally rather than
  buffering all file contents simultaneously. (NICE)

## Success Criteria

- **SC-001**: `discoverCommands` call count equals 1 regardless of how many commands are
  executed in a session, verified by unit test.
- **SC-002**: `readFileSync` call count for `approvals.json` is at most 1 per save-read
  cycle when tested with 10 consecutive reads, verified by spy.
- **SC-003**: `detectActiveWorkspace` with one matching workspace does not call
  `hasUncommittedChanges` at all when the branch name matches, verified by unit test.
