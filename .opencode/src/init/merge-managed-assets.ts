import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { ManagedAsset } from "./managed-assets";

const MERGE_ACTION = {
  ADD: "add",
  KEEP: "keep",
  REVIEW: "review",
} as const;

type MergeAction = (typeof MERGE_ACTION)[keyof typeof MERGE_ACTION];

interface MergePlanAction {
  action: MergeAction;
  relativePath: string;
  sourcePath: string;
  targetPath: string;
}

interface MergePlan {
  actions: MergePlanAction[];
}

function createMergePlan(targetRoot: string, managedAssets: ManagedAsset[]): MergePlan {
  const actions = managedAssets.map((asset) => {
    const targetPath = path.join(targetRoot, asset.relativePath);
    if (!existsSync(targetPath)) {
      return {
        action: MERGE_ACTION.ADD,
        relativePath: asset.relativePath,
        sourcePath: asset.sourcePath,
        targetPath,
      };
    }

    const sourceContents = readFileSync(asset.sourcePath, "utf8");
    const targetContents = readFileSync(targetPath, "utf8");
    return {
      action: sourceContents === targetContents ? MERGE_ACTION.KEEP : MERGE_ACTION.REVIEW,
      relativePath: asset.relativePath,
      sourcePath: asset.sourcePath,
      targetPath,
    };
  });

  return { actions };
}

export { MERGE_ACTION, createMergePlan };
export type { MergeAction, MergePlan, MergePlanAction };
