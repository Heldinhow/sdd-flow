# Developer Experience - Tasks

## Task List

### Code Quality

#### Task 1.1: Fix unsafe type casts
**File:** `spec-driven-agent.ts:91`
**Issue:** `as never` bypasses TypeScript
**Fix:** Use proper type guard
**Verification:** `bunx tsc --noEmit` passes

#### Task 1.2: Fix unsafe type casts in command-registry
**File:** `command-registry.ts:189`
**Issue:** `as never` bypasses TypeScript
**Fix:** Use proper type guard
**Verification:** `bunx tsc --noEmit` passes

#### Task 1.3: Remove or use unused exports
**File:** `multi-repo-workspace.ts`
**Issue:** Functions never called
**Fix:** Either implement or remove
**Verification:** All exports are used

### Documentation

#### Task 2.1: Add CONTRIBUTING.md
**File:** `CONTRIBUTING.md` (new)
**Description:** 
- How to set up dev environment
- How to run tests
- How to submit PRs
- Coding standards
**Verification:** File exists and is accurate

#### Task 2.2: Add architecture docs
**File:** `docs/architecture.md` (new)
**Description:**
- System overview
- Component diagram
- Data flow
**Verification:** New contributors can understand system

#### Task 2.3: Add troubleshooting guide
**File:** `docs/troubleshooting.md` (new)
**Description:**
- Common errors and solutions
- Debug tips
- FAQ
**Verification:** Common issues are documented
