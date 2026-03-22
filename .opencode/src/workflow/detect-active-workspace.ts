import { readdirSync, statSync } from "node:fs";
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

function getWorkspaceLastCommitTimestamp(repoRoot: string, workspace: string): number {
  try {
    const workspacePath = path.join(repoRoot, "specs", workspace);
    const timestamp = execSync(
      `git log -1 --format=%ct -- "${workspacePath}"`,
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
        cwd: repoRoot,
      },
    ).trim();
    return timestamp ? parseInt(timestamp, 10) * 1000 : 0;
  } catch {
    return 0;
  }
}

function detectActiveWorkspace(repoRoot: string): string | null {
  const specsRoot = path.join(repoRoot, "specs");

  try {
    const entries = readdirSync(specsRoot)
      .filter((entry) => statSync(path.join(specsRoot, entry)).isDirectory());

    if (entries.length === 0) {
      return null;
    }

    const currentBranch = getCurrentBranch();
    if (currentBranch && currentBranch !== "HEAD" && entries.includes(currentBranch)) {
      return currentBranch;
    }

    const sorted = entries.sort((left, right) => {
      const leftTs = getWorkspaceLastCommitTimestamp(repoRoot, left);
      const rightTs = getWorkspaceLastCommitTimestamp(repoRoot, right);
      return leftTs - rightTs;
    });

    const lastModified = sorted.find((entry) => getWorkspaceLastCommitTimestamp(repoRoot, entry) > 0);
    return lastModified ?? null;
  } catch {
    return null;
  }
}

export { detectActiveWorkspace };
