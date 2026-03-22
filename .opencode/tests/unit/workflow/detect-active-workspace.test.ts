import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { detectActiveWorkspace } from "../../../src/workflow/detect-active-workspace";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("detectActiveWorkspace", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(path.join(tmpdir(), "sdd-workspace-test-"));
    mkdirSync(path.join(tempRoot, "specs"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("returns null when specs directory does not exist", () => {
    rmSync(path.join(tempRoot, "specs"), { recursive: true });
    expect(detectActiveWorkspace(tempRoot)).toBeNull();
  });

  it("returns null when specs directory is empty", () => {
    expect(detectActiveWorkspace(tempRoot)).toBeNull();
  });

  it("returns workspace when spec.md exists in directory", () => {
    const workspaceDir = path.join(tempRoot, "specs", "my-workspace");
    mkdirSync(workspaceDir, { recursive: true });
    writeFileSync(path.join(workspaceDir, "spec.md"), "# Test");
    expect(detectActiveWorkspace(tempRoot)).toBe("my-workspace");
  });

  it("returns null when no workspace has spec.md", () => {
    const workspaceDir = path.join(tempRoot, "specs", "empty-workspace");
    mkdirSync(workspaceDir, { recursive: true });
    expect(detectActiveWorkspace(tempRoot)).toBeNull();
  });

  it("returns first workspace when multiple exist", () => {
    mkdirSync(path.join(tempRoot, "specs", "workspace-a"), { recursive: true });
    mkdirSync(path.join(tempRoot, "specs", "workspace-b"), { recursive: true });
    writeFileSync(path.join(tempRoot, "specs", "workspace-a", "spec.md"), "# A");
    writeFileSync(path.join(tempRoot, "specs", "workspace-b", "spec.md"), "# B");
    expect(detectActiveWorkspace(tempRoot)).toBe("workspace-a");
  });
});