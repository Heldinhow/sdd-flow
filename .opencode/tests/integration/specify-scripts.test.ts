import { describe, expect, it } from "bun:test";
import { cpSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../../..");
const commonScript = path.join(repoRoot, ".specify/scripts/bash/common.sh");
const createFeatureScript = path.join(repoRoot, ".specify/scripts/bash/create-new-feature.sh");
const checkPrerequisitesScript = path.join(repoRoot, ".specify/scripts/bash/check-prerequisites.sh");
const setupPlanScript = path.join(repoRoot, ".specify/scripts/bash/setup-plan.sh");

async function runShell(command: string, cwd: string, env: Record<string, string> = {}) {
  const child = Bun.spawn({
    cmd: ["bash", "-lc", command],
    cwd,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(child.stdout).text();
  const stderr = await new Response(child.stderr).text();
  const exitCode = await child.exited;

  return { exitCode, stdout, stderr };
}

function createTempWorkflowRepo() {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "sdd-specify-"));
  cpSync(path.join(repoRoot, ".specify"), path.join(tempRoot, ".specify"), {
    recursive: true,
  });
  mkdirSync(path.join(tempRoot, "specs"));
  return tempRoot;
}

describe("specify shell scripts", () => {
  it("prefers the local .specify root over the parent git root", async () => {
    const result = await runShell(`source "${commonScript}"; get_repo_root`, repoRoot);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(repoRoot);
  });

  it("creates typed feature branches with a short name", async () => {
    const tempRoot = createTempWorkflowRepo();
    await runShell("git init", tempRoot);

    const result = await runShell(
      `"${createFeatureScript}" --json --type feat --short-name "opencode-sdd-agent" "Create unified SDD workflow"`,
      tempRoot,
      { SPECIFY_REPO_ROOT: tempRoot },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("feat-opencode-sdd-agent");
    expect(await Bun.file(path.join(tempRoot, "specs/feat-opencode-sdd-agent/spec.md")).exists()).toBe(true);
  });

  it("runs setup-plan for typed feature workspaces", async () => {
    const tempRoot = createTempWorkflowRepo();
    const featureDir = path.join(tempRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(featureDir, { recursive: true });
    writeFileSync(path.join(featureDir, "spec.md"), "# spec\n");

    const result = await runShell(
      `"${setupPlanScript}" --json`,
      tempRoot,
      {
        SPECIFY_REPO_ROOT: tempRoot,
        SPECIFY_FEATURE: "feat-opencode-sdd-agent",
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("feat-opencode-sdd-agent");
    expect(await Bun.file(path.join(featureDir, "plan.md")).exists()).toBe(true);
  });

  it("resolves typed feature workspaces in prerequisite checks", async () => {
    const tempRoot = createTempWorkflowRepo();
    const featureDir = path.join(tempRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(featureDir, { recursive: true });
    writeFileSync(path.join(featureDir, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureDir, "plan.md"), "# plan\n");
    writeFileSync(path.join(featureDir, "tasks.md"), "# tasks\n");

    const result = await runShell(
      `"${checkPrerequisitesScript}" --json --require-tasks --include-tasks`,
      tempRoot,
      {
        SPECIFY_REPO_ROOT: tempRoot,
        SPECIFY_FEATURE: "feat-opencode-sdd-agent",
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("feat-opencode-sdd-agent");
    expect(result.stdout).toContain("tasks.md");
  });
});
