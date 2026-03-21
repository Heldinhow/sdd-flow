import { readdirSync, statSync } from "node:fs";
import path from "node:path";

function detectActiveWorkspace(repoRoot: string): string | null {
  const specsRoot = path.join(repoRoot, "specs");

  try {
    const entries = readdirSync(specsRoot)
      .map((entry) => ({
        entry,
        absolutePath: path.join(specsRoot, entry),
      }))
      .filter((entry) => statSync(entry.absolutePath).isDirectory())
      .sort((left, right) => statSync(left.absolutePath).mtimeMs - statSync(right.absolutePath).mtimeMs);

    return entries.at(-1)?.entry ?? null;
  } catch {
    return null;
  }
}

export { detectActiveWorkspace };
