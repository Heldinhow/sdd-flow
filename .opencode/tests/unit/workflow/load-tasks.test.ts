import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadTasks } from "../../../src/workflow/load-tasks";

describe("load-tasks", () => {
  it("returns hasErrors when tasks file does not exist", () => {
    const result = loadTasks("/nonexistent/tasks.md", "feat-test");

    expect(result.hasErrors).toBe(true);
    expect(result.errorMessage).toContain("not found");
    expect(result.tasks).toHaveLength(0);
    expect(result.totalTasks).toBe(0);
  });

  it("parses tasks with checkbox and id from tasks.md", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1: Setup

- [x] SETUP001 Initialize project structure
- [ ] SETUP002 Configure build system

## Phase 2: Implementation

- [ ] IMPL003 Implement core functionality
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.hasErrors).toBe(false);
    expect(result.totalTasks).toBe(3);
    expect(result.completedTasks).toBe(1);
    expect(result.tasks[0]?.id).toBe("SETUP001");
    expect(result.tasks[0]?.completed).toBe(true);
    expect(result.tasks[1]?.id).toBe("SETUP002");
    expect(result.tasks[1]?.completed).toBe(false);
    expect(result.tasks[2]?.id).toBe("IMPL003");
    expect(result.tasks[2]?.completed).toBe(false);
  });

  it("extracts phases from section headers", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1: Backend API

- [ ] BACK001 Create endpoint handler

## Phase 2: Frontend UI

- [ ] FRONT001 Build component
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.phases).toContain("Backend API");
    expect(result.phases).toContain("Frontend UI");
    expect(result.tasks[0]?.phase).toBe("Backend API");
    expect(result.tasks[1]?.phase).toBe("Frontend UI");
  });

  it("marks parallel tasks with [P] flag", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1: Setup

- [ ] SETUP001 [P] Task that can run in parallel
- [ ] SETUP002 Regular task
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.tasks[0]?.parallel).toBe(true);
    expect(result.tasks[1]?.parallel).toBe(false);
  });

  it("extracts user story references", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1: Setup

- [ ] SETUP001 [US001] User story task
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.tasks[0]?.userStory).toBe("US001");
  });

  it("extracts file paths from task descriptions", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1: Implementation

- [ ] IMPL001 Create src/server/api.ts and src/server/routes.ts
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.tasks[0]?.filePaths).toContain("src/server/api.ts");
    expect(result.tasks[0]?.filePaths).toContain("src/server/routes.ts");
  });

  it("handles uppercase X as completed", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1

- [X] TASK001 Completed task
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    expect(result.tasks[0]?.completed).toBe(true);
  });

  it("returns correct featureDir in result", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(tasksPath, "## Phase 1\n\n- [ ] TASK001 Test task\n");

    const result = loadTasks(tasksPath, "feat-my-feature");

    expect(result.featureDir).toBe("feat-my-feature");
  });

  it("deduplicates file paths within a single task description", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-load-tasks-"));
    const tasksPath = path.join(repoRoot, "tasks.md");
    writeFileSync(
      tasksPath,
      `## Phase 1

- [ ] TASK001 Use src/api.ts and src/api.ts again
`,
    );

    const result = loadTasks(tasksPath, "feat-test");

    // Deduplication is within each task's filePaths array
    expect(result.tasks[0]?.filePaths.filter((f) => f === "src/api.ts")).toHaveLength(1);
  });
});
