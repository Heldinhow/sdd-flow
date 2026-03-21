import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { detectRepoState } from "./detect-repo-state";
import { buildManagedAssetManifest } from "./managed-assets";
import { MERGE_ACTION, createMergePlan } from "./merge-managed-assets";

interface RunInitInput {
  sourceRoot: string;
  targetRoot: string;
}

interface RunInitResult {
  addedAssets: string[];
  keptAssets: string[];
  reviewAssets: string[];
  nextRecommendation: string;
  needsInitialization: boolean;
}

function ensureParentDirectory(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function runInit(input: RunInitInput): RunInitResult {
  const manifest = buildManagedAssetManifest(input.sourceRoot);
  const state = detectRepoState(input.targetRoot, manifest);
  const plan = createMergePlan(input.targetRoot, manifest);

  const addedAssets: string[] = [];
  const keptAssets: string[] = [];
  const reviewAssets: string[] = [];

  for (const action of plan.actions) {
    if (action.action === MERGE_ACTION.ADD) {
      ensureParentDirectory(action.targetPath);
      copyFileSync(action.sourcePath, action.targetPath);
      addedAssets.push(action.relativePath);
      continue;
    }

    if (action.action === MERGE_ACTION.KEEP) {
      keptAssets.push(action.relativePath);
      continue;
    }

    reviewAssets.push(action.relativePath);
  }

  return {
    addedAssets,
    keptAssets,
    reviewAssets,
    nextRecommendation: "Repository initialized. Start /sdd to begin the guided planning flow.",
    needsInitialization: state.needsInitialization,
  };
}

export { runInit };
export type { RunInitInput, RunInitResult };
