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

function detectActiveWorkspace(repoRoot: string): string | null {
  const specsRoot = path.join(repoRoot, "specs");

  try {
    const entries = readdirSync(specsRoot)
      .filter((entry) => statSync(path.join(specsRoot, entry)).isDirectory());

    if (entries.length === 0) {
      return null;
    }

    // Try to match current git branch to a workspace directory name
    const currentBranch = getCurrentBranch();
    if (currentBranch && currentBranch !== "HEAD" && entries.includes(currentBranch)) {
      return currentBranch;
    }

    // Fallback: return the most recently modified workspace
    const sorted = entries.sort((left, right) => {
      const leftPath = path.join(specsRoot, left);
      const rightPath = path.join(specsRoot, right);
      return statSync(leftPath).mtimeMs - statSync(rightPath).mtimeMs;
    });

    return sorted.at(-1) ?? null;
  } catch {
    return null;
  }
}

export { detectActiveWorkspace };
