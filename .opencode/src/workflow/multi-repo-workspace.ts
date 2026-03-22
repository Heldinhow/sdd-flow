import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

interface RepoConfig {
  name: string;
  url?: string;
  localPath: string;
  isPrimary: boolean;
  branch?: string;
}

interface MultiRepoWorkspaceConfig {
  version: "1.0";
  primaryRepo: string;
  repos: RepoConfig[];
  linkedAt: string;
}

interface MultiRepoContext {
  workspaceRoot: string;
  primaryRepoRoot: string;
  repos: Map<string, RepoConfig>;
  primaryRepo: RepoConfig;
  isMultiRepo: boolean;
}

interface LoadMultiRepoWorkspaceInput {
  workspaceRoot: string;
  primaryRepoRoot: string;
}

const WORKSPACE_CONFIG_FILE = "workspace.config.json";

function loadMultiRepoConfig(workspaceRoot: string): MultiRepoWorkspaceConfig | null {
  const configPath = join(workspaceRoot, WORKSPACE_CONFIG_FILE);

  if (!existsSync(configPath)) return null;

  try {
    const content = readFileSync(configPath, "utf-8");
    const config = JSON.parse(content) as MultiRepoWorkspaceConfig;

    // Validate version
    if (config.version !== "1.0") return null;

    return config;
  } catch {
    return null;
  }
}

function loadMultiRepoWorkspace(input: LoadMultiRepoWorkspaceInput): MultiRepoContext {
  const { workspaceRoot, primaryRepoRoot } = input;

  const config = loadMultiRepoConfig(workspaceRoot);
  const repos = new Map<string, RepoConfig>();

  let primaryRepo: RepoConfig | null = null;

  if (config) {
    for (const repo of config.repos) {
      repos.set(repo.name, repo);
      if (repo.isPrimary) {
        primaryRepo = repo;
      }
    }
  }

  // If no config, create a single-repo context
  if (!primaryRepo) {
    primaryRepo = {
      name: "primary",
      localPath: primaryRepoRoot,
      isPrimary: true,
    };
    repos.set("primary", primaryRepo);
  }

  return {
    workspaceRoot,
    primaryRepoRoot,
    repos,
    primaryRepo,
    isMultiRepo: config !== null && config.repos.length > 1,
  };
}

function createMultiRepoConfig(
  workspaceRoot: string,
  primaryRepoRoot: string,
  additionalRepos: Omit<RepoConfig, "isPrimary">[] = [],
): MultiRepoWorkspaceConfig {
  const repos: RepoConfig[] = [
    {
      name: "primary",
      localPath: primaryRepoRoot,
      isPrimary: true,
      branch: getCurrentBranch(primaryRepoRoot) || undefined,
    },
    ...additionalRepos.map((r) => ({ ...r, isPrimary: false })),
  ];

  const config: MultiRepoWorkspaceConfig = {
    version: "1.0",
    primaryRepo: primaryRepoRoot,
    repos,
    linkedAt: new Date().toISOString(),
  };

  const configPath = join(workspaceRoot, WORKSPACE_CONFIG_FILE);
  mkdirSync(workspaceRoot, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return config;
}

function addRepoToWorkspace(
  workspaceRoot: string,
  newRepo: Omit<RepoConfig, "isPrimary">,
): MultiRepoWorkspaceConfig | null {
  const config = loadMultiRepoConfig(workspaceRoot);

  if (!config) {
    // No existing config - need to know the primary repo root
    return null;
  }

  // Check if repo already exists
  if (config.repos.some((r) => r.name === newRepo.name)) {
    return null;
  }

  config.repos.push({ ...newRepo, isPrimary: false });

  const configPath = join(workspaceRoot, WORKSPACE_CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return config;
}

function removeRepoFromWorkspace(workspaceRoot: string, repoName: string): boolean {
  const config = loadMultiRepoConfig(workspaceRoot);

  if (!config) return false;

  const index = config.repos.findIndex((r) => r.name === repoName && !r.isPrimary);
  if (index === -1) return false;

  config.repos.splice(index, 1);

  const configPath = join(workspaceRoot, WORKSPACE_CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return true;
}

function linkWorkspaceToRepos(workspaceRoot: string, primaryRepoRoot: string, additionalRepoPaths: string[] = []): MultiRepoWorkspaceConfig {
  const additionalRepos: Omit<RepoConfig, "isPrimary">[] = additionalRepoPaths.map((localPath) => ({
    name: getRepoName(localPath) || localPath,
    localPath,
    isPrimary: false,
  }));

  return createMultiRepoConfig(workspaceRoot, primaryRepoRoot, additionalRepos);
}

function getRepoName(repoPath: string): string | null {
  try {
    const result = execSync("git remote get-url origin 2>/dev/null || true", {
      encoding: "utf-8",
      cwd: repoPath,
    }).trim();

    if (!result) return null;

    // Extract repo name from URL (e.g., "user/repo" from "https://github.com/user/repo.git")
    const match = result.match(/\/([^\/]+?)(?:\.git)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function getCurrentBranch(repoPath: string): string | null {
  try {
    return execSync("git branch --show-current 2>/dev/null || true", {
      encoding: "utf-8",
      cwd: repoPath,
    }).trim() || null;
  } catch {
    return null;
  }
}

function listLinkedRepos(workspaceRoot: string): RepoConfig[] {
  const config = loadMultiRepoConfig(workspaceRoot);
  return config?.repos || [];
}

function isRepoLinked(workspaceRoot: string, repoName: string): boolean {
  const config = loadMultiRepoConfig(workspaceRoot);
  if (!config) return false;

  return config.repos.some((r) => r.name === repoName);
}

function getRepoRootForFeature(workspaceRoot: string, featureName: string): string {
  const config = loadMultiRepoConfig(workspaceRoot);

  if (!config) {
    // Single repo mode - feature is in primary repo
    return join(workspaceRoot, "specs", featureName);
  }

  // Search all repos to find the one that has this feature
  for (const repo of config.repos) {
    const featurePath = join(repo.localPath, "specs", featureName);
    if (existsSync(featurePath)) {
      return featurePath;
    }
  }

  // Feature not found in any repo - default to primary repo
  const primaryRepoConfig = config.repos.find((r) => r.isPrimary);
  const primaryPath = primaryRepoConfig?.localPath ?? config.primaryRepo;
  return join(primaryPath, "specs", featureName);
}

function getAllFeaturePaths(workspaceRoot: string, featureName: string): { repo: string; path: string }[] {
  const config = loadMultiRepoConfig(workspaceRoot);
  const results: { repo: string; path: string }[] = [];

  if (!config) {
    return results;
  }

  for (const repo of config.repos) {
    const featurePath = join(repo.localPath, "specs", featureName);
    if (existsSync(featurePath)) {
      results.push({ repo: repo.name, path: featurePath });
    }
  }

  return results;
}

export {
  loadMultiRepoWorkspace,
  loadMultiRepoConfig,
  createMultiRepoConfig,
  linkWorkspaceToRepos,
  getRepoRootForFeature,
  getAllFeaturePaths,
};
export type { RepoConfig, MultiRepoWorkspaceConfig, MultiRepoContext, LoadMultiRepoWorkspaceInput };
