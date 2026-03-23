import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MANAGED_ASSET_GROUP = {
  COMMAND: "command",
  RUNTIME: "runtime",
  SKILL: "skill",
  SCRIPT: "script",
  TEMPLATE: "template",
  MEMORY: "memory",
} as const;

const MANAGED_ASSET_ROOT = {
  OPENCODE_COMMAND: ".opencode/command",
  OPENCODE_SKILLS: ".opencode/skills",
  SPECIFY_SCRIPTS: ".specify/scripts/bash",
  SPECIFY_TEMPLATES: ".specify/templates",
  SPECIFY_MEMORY: ".specify/memory",
} as const;

const MANAGED_ASSETS_BUNDLE = ["managed-assets"] as const;

function resolvePackageRoot(): string {
  return path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
}

function resolveManagedAssetSourceRoot(): string {
  return path.join(resolvePackageRoot(), ...MANAGED_ASSETS_BUNDLE);
}

type ManagedAssetGroup = (typeof MANAGED_ASSET_GROUP)[keyof typeof MANAGED_ASSET_GROUP];

interface ManagedAsset {
  relativePath: string;
  sourcePath: string;
  group: ManagedAssetGroup;
}

function collectRelativeFiles(sourceRoot: string, relativePath: string): string[] {
  const absolutePath = path.join(sourceRoot, relativePath);

  if (!existsSync(absolutePath)) {
    return [];
  }

  const stats = statSync(absolutePath);

  if (stats.isFile()) {
    return [relativePath];
  }

  return readdirSync(absolutePath)
    .sort()
    .flatMap((entry) => collectRelativeFiles(sourceRoot, path.join(relativePath, entry)));
}

function inferManagedAssetGroup(relativePath: string): ManagedAssetGroup {
  if (relativePath.startsWith(".opencode/command/")) {
    return MANAGED_ASSET_GROUP.COMMAND;
  }
  if (relativePath.startsWith(".opencode/skills/")) {
    return MANAGED_ASSET_GROUP.SKILL;
  }
  if (relativePath.startsWith(".specify/scripts/")) {
    return MANAGED_ASSET_GROUP.SCRIPT;
  }
  if (relativePath.startsWith(".specify/templates/")) {
    return MANAGED_ASSET_GROUP.TEMPLATE;
  }
  if (relativePath.startsWith(".specify/memory/")) {
    return MANAGED_ASSET_GROUP.MEMORY;
  }
  return MANAGED_ASSET_GROUP.RUNTIME;
}

function buildManagedAssetManifest(sourceRoot: string): ManagedAsset[] {
  const relativePaths = Object.values(MANAGED_ASSET_ROOT)
    .flatMap((relativePath) => collectRelativeFiles(sourceRoot, relativePath))
    .sort();

  return relativePaths.map((relativePath) => ({
    relativePath,
    sourcePath: path.join(sourceRoot, relativePath),
    group: inferManagedAssetGroup(relativePath),
  }));
}

export { MANAGED_ASSET_GROUP, MANAGED_ASSET_ROOT, buildManagedAssetManifest };
export type { ManagedAsset, ManagedAssetGroup };
