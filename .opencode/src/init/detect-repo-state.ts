import { existsSync } from "node:fs";
import path from "node:path";

import type { ManagedAsset } from "./managed-assets";

interface RepoState {
  targetRoot: string;
  hasOpencode: boolean;
  hasSpecify: boolean;
  presentAssets: string[];
  missingAssets: string[];
  needsInitialization: boolean;
}

function detectRepoState(targetRoot: string, managedAssets: ManagedAsset[]): RepoState {
  const presentAssets = managedAssets
    .filter((asset) => existsSync(path.join(targetRoot, asset.relativePath)))
    .map((asset) => asset.relativePath);
  const missingAssets = managedAssets
    .filter((asset) => !existsSync(path.join(targetRoot, asset.relativePath)))
    .map((asset) => asset.relativePath);

  return {
    targetRoot,
    hasOpencode: existsSync(path.join(targetRoot, ".opencode")),
    hasSpecify: existsSync(path.join(targetRoot, ".specify")),
    presentAssets,
    missingAssets,
    needsInitialization: missingAssets.length > 0,
  };
}

export { detectRepoState };
export type { RepoState };
