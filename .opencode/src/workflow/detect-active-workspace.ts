import { readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

function getCurrentBranch(): string | null {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    })
      .trim();
  } catch {
    return null;
  }
}

function hasUncommittedChanges(workspacePath: string): boolean {
  try {
    const output = execSync("git status --porcelain", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
      cwd: workspacePath,
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function hasRecentEdits(workspacePath: string): boolean {
  try {
    const output = execSync(
      "git log --oneline -1 -- spec.md plan.md",
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
        cwd: workspacePath,
      },
    );
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function isGitAvailable(repoRoot: string): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
      cwd: repoRoot,
    });
    return true;
  } catch {
    return false;
  }
}

function detectActiveWorkspace(repoRoot: string): string | null {
  const specsRoot = path.join(repoRoot, "specs");

  try {
    const entries = readdirSync(specsRoot).filter((entry) =>
      existsSync(path.join(specsRoot, entry, "spec.md")),
    );

    if (entries.length === 0) {
      return null;
    }

    const currentBranch = getCurrentBranch();
    if (currentBranch && currentBranch !== "HEAD" && entries.includes(currentBranch)) {
      return currentBranch;
    }

    if (isGitAvailable(repoRoot)) {
      const withUncommitted = entries.filter((entry) =>
        hasUncommittedChanges(path.join(specsRoot, entry)),
      );
      if (withUncommitted.length === 1) {
        return withUncommitted[0];
      }

      const withRecentEdits = entries.filter((entry) =>
        hasRecentEdits(path.join(specsRoot, entry)),
      );
      if (withRecentEdits.length === 1) {
        return withRecentEdits[0];
      }
    }

    return entries[0] ?? null;
  } catch {
    return null;
  }
}

export { detectActiveWorkspace };
