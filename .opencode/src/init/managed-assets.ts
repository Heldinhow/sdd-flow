import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const MANAGED_ASSET_GROUP = {
  COMMAND: "command",
  RUNTIME: "runtime",
  SCRIPT: "script",
  TEMPLATE: "template",
  MEMORY: "memory",
  GUIDE: "guide",
} as const;

const MANAGED_ASSET_ROOT = {
  OPENCODE_COMMAND: ".opencode/command",
  OPENCODE_PLUGIN: ".opencode/plugin",
  OPENCODE_PLUGINS: ".opencode/plugins",
  OPENCODE_SOURCE: ".opencode/src",
  OPENCODE_PACKAGE: ".opencode/package.json",
  OPENCODE_LOCKFILE: ".opencode/bun.lock",
  OPENCODE_GITIGNORE: ".opencode/.gitignore",
  OPENCODE_TSCONFIG: ".opencode/tsconfig.json",
  SPECIFY_SCRIPTS: ".specify/scripts/bash",
  SPECIFY_TEMPLATES: ".specify/templates",
  SPECIFY_MEMORY: ".specify/memory/constitution.md",
  GUIDE: "AGENTS.md",
} as const;

type ManagedAssetGroup = (typeof MANAGED_ASSET_GROUP)[keyof typeof MANAGED_ASSET_GROUP];

interface ManagedAsset {
  relativePath: string;
  sourcePath: string;
  group: ManagedAssetGroup;
}

function collectRelativeFiles(sourceRoot: string, relativePath: string): string[] {
  const absolutePath = path.join(sourceRoot, relativePath);
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
  if (relativePath.startsWith(".specify/scripts/")) {
    return MANAGED_ASSET_GROUP.SCRIPT;
  }
  if (relativePath.startsWith(".specify/templates/")) {
    return MANAGED_ASSET_GROUP.TEMPLATE;
  }
  if (relativePath.startsWith(".specify/memory/")) {
    return MANAGED_ASSET_GROUP.MEMORY;
  }
  if (relativePath === "AGENTS.md") {
    return MANAGED_ASSET_GROUP.GUIDE;
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
