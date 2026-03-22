#!/usr/bin/env bun

/**
 * SDD CLI - Standalone Spec-Driven Development CLI
 * Provides a standalone binary for running SDD workflow commands.
 */

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { execSync } from "node:child_process";

const BANNER = `
╔═══════════════════════════════════════════════════╗
║   SDD CLI - Spec-Driven Development Workflow       ║
╚═══════════════════════════════════════════════════╝
`;

const USAGE = `
Usage: sdd <command> [options]

Commands:
  init              Initialize the repository for SDD workflow
  status            Show current workspace status
  workspaces        List all feature workspaces
  new <name>        Create a new feature workspace
  help              Show this help message

Options:
  --help, -h        Show help for a specific command
  --json            Output in JSON format (where supported)

Examples:
  sdd init
  sdd status
  sdd new user-authentication
  sdd workspaces --json
`;

interface CliOptions {
  help?: boolean;
  json?: boolean;
}

interface InitOptions extends CliOptions {}

interface StatusOptions extends CliOptions {
  feature?: string;
}

interface NewOptions extends CliOptions {
  branch?: string;
}

interface WorkspacesOptions extends CliOptions {}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function getRepoRoot(): string {
  try {
    const result = execSync("git rev-parse --show-toplevel 2>/dev/null", {
      encoding: "utf-8",
      cwd: cwd(),
    });
    return result.trim();
  } catch {
    return cwd();
  }
}

function getCurrentBranch(): string {
  try {
    const result = execSync("git branch --show-current 2>/dev/null", {
      encoding: "utf-8",
      cwd: cwd(),
    });
    return result.trim();
  } catch {
    return "";
  }
}

function findSpecDir(repoRoot: string): string {
  return join(repoRoot, "specs");
}

function findFeatureDir(repoRoot: string, feature?: string): string | null {
  const specsDir = findSpecDir(repoRoot);
  if (!existsSync(specsDir)) return null;

  if (feature) {
    const dir = join(specsDir, feature);
    return existsSync(dir) ? dir : null;
  }

  // Find active workspace from current branch
  const branch = getCurrentBranch();
  if (!branch) return null;

  const dir = join(specsDir, branch);
  return existsSync(dir) ? dir : null;
}

function runScript(scriptPath: string, args: string[] = []): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`bash "${scriptPath}" ${args.join(" ")}`, {
      encoding: "utf-8",
      cwd: cwd(),
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: unknown) {
    const err = error as { stderr?: string; status?: number };
    return {
      stdout: "",
      stderr: err.stderr || String(error),
      exitCode: err.status || 1,
    };
  }
}

function getScriptPath(scriptName: string): string | null {
  const repoRoot = getRepoRoot();
  // Try repo-local scripts first
  const repoScript = join(repoRoot, ".specify", "scripts", "bash", scriptName);
  if (existsSync(repoScript)) return repoScript;

  // Fall back to bundled scripts
  const bundleRoot = join(import.meta.dir, "..");
  const bundleScript = join(bundleRoot, ".specify", "scripts", "bash", scriptName);
  if (existsSync(bundleScript)) return bundleScript;

  return null;
}

function isInitialized(repoRoot: string): boolean {
  return existsSync(join(repoRoot, ".specify")) && existsSync(join(repoRoot, ".opencode"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Command: init
// ─────────────────────────────────────────────────────────────────────────────

async function cmdInit(_args: InitOptions): Promise<void> {
  console.log(BANNER);
  console.log("Initializing SDD workflow...\n");

  const repoRoot = getRepoRoot();
  const opencodeDir = join(repoRoot, ".opencode");
  const specifyDir = join(repoRoot, ".specify");

  if (isInitialized(repoRoot)) {
    console.log("✓ Repository already initialized for SDD workflow.");
    console.log(`  .specify/ directory: ${specifyDir}`);
    console.log(`  .opencode/ directory: ${opencodeDir}`);
    return;
  }

  // Run the init script
  const initScript = getScriptPath("create-new-feature.sh");
  if (!existsSync(initScript)) {
    console.error("Error: Init script not found. Run from within an SDD-enabled project.");
    process.exit(1);
  }

  try {
    execSync(`bash "${initScript}" -- "init"`, {
      cwd: repoRoot,
      stdio: "inherit",
    });
    console.log("\n✓ SDD workflow initialized successfully.");
  } catch {
    console.error("\n✗ Initialization failed.");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Command: status
// ─────────────────────────────────────────────────────────────────────────────

async function cmdStatus(args: StatusOptions): Promise<void> {
  const repoRoot = getRepoRoot();
  const branch = getCurrentBranch();
  const featureDir = findFeatureDir(repoRoot, args.feature);

  if (args.json) {
    const status: Record<string, unknown> = {
      repoRoot,
      branch: branch || null,
      initialized: isInitialized(repoRoot),
      activeWorkspace: null as string | null,
      artifacts: {
        spec: false,
        plan: false,
        tasks: false,
      },
    };

    if (featureDir) {
      status.activeWorkspace = featureDir.split("/").pop() || null;
      status.artifacts = {
        spec: existsSync(join(featureDir, "spec.md")),
        plan: existsSync(join(featureDir, "plan.md")),
        tasks: existsSync(join(featureDir, "tasks.md")),
      };
    }

    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log(BANNER);
  console.log(`Repository: ${repoRoot}`);
  console.log(`Branch: ${branch || "(not a git repo)"}`);
  console.log(`Initialized: ${isInitialized(repoRoot) ? "✓" : "✗"}`);

  if (!featureDir) {
    console.log("\nNo active workspace.");
    console.log("Run 'sdd new <feature-name>' to create a new feature workspace.");
    return;
  }

  const featureName = featureDir.split("/").pop()!;
  console.log(`\nActive Workspace: ${featureName}`);

  const specExists = existsSync(join(featureDir, "spec.md"));
  const planExists = existsSync(join(featureDir, "plan.md"));
  const tasksExists = existsSync(join(featureDir, "tasks.md"));

  console.log("\nArtifacts:");
  console.log(`  spec.md   ${specExists ? "✓" : "✗"}`);
  console.log(`  plan.md   ${planExists ? "✓" : "✗"}`);
  console.log(`  tasks.md  ${tasksExists ? "✓" : "✗"}`);

  // Determine phase
  let phase = "initialized";
  if (tasksExists) phase = "tasks";
  else if (planExists) phase = "plan";
  else if (specExists) phase = "spec";

  console.log(`\nPhase: ${phase}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Command: workspaces
// ─────────────────────────────────────────────────────────────────────────────

async function cmdWorkspaces(_args: WorkspacesOptions): Promise<void> {
  const repoRoot = getRepoRoot();
  const specsDir = findSpecDir(repoRoot);
  const branch = getCurrentBranch();

  if (!existsSync(specsDir)) {
    if (_args.json) {
      console.log(JSON.stringify({ workspaces: [] }));
    } else {
      console.log("No workspaces found. Run 'sdd new <feature-name>' to create one.");
    }
    return;
  }

  // Use the list-workspaces script
  const scriptPath = getScriptPath("list-workspaces.sh");
  if (existsSync(scriptPath)) {
    const jsonFlag = _args.json ? "--json" : "";
    try {
      const output = execSync(`bash "${scriptPath}" ${jsonFlag}`, {
        encoding: "utf-8",
        cwd: repoRoot,
      });
      console.log(output);
      return;
    } catch {
      // Fall through to manual implementation
    }
  }

  // Manual workspace listing
  if (_args.json) {
    // Use exec to find directories
    const result = execSync(
      `find "${specsDir}" -maxdepth 1 -type d -exec basename {} \\; 2>/dev/null | grep -v "^specs$" | sort`,
      { encoding: "utf-8" }
    );
    const names = result.trim().split("\n").filter(Boolean);
    const workspaces = names.map((name) => {
      const dir = join(specsDir, name);
      const isActive = name === branch;
      const specExists = existsSync(join(dir, "spec.md"));
      const planExists = existsSync(join(dir, "plan.md"));
      const tasksExists = existsSync(join(dir, "tasks.md"));
      let phase = "initialized";
      if (tasksExists) phase = "tasks";
      else if (planExists) phase = "plan";
      else if (specExists) phase = "spec";
      return { name, phase, is_active: isActive, artifacts: { spec: specExists, plan: planExists, tasks: tasksExists } };
    });
    console.log(JSON.stringify({ workspaces }, null, 2));
  } else {
    console.log(BANNER);
    const result = execSync(
      `find "${specsDir}" -maxdepth 1 -type d -exec basename {} \\; 2>/dev/null | grep -v "^specs$" | sort`,
      { encoding: "utf-8" }
    );
    const names = result.trim().split("\n").filter(Boolean);
    if (names.length === 0) {
      console.log("No workspaces found.");
      return;
    }
    for (const name of names) {
      const dir = join(specsDir, name);
      const isActive = name === branch;
      const activeMarker = isActive ? " (active)" : "";
      console.log(`\n${name}${activeMarker}`);
      const scriptPath2 = getScriptPath("list-workspaces.sh");
      if (existsSync(scriptPath2)) {
        // Just show a summary
        const specExists = existsSync(join(dir, "spec.md"));
        const planExists = existsSync(join(dir, "plan.md"));
        const tasksExists = existsSync(join(dir, "tasks.md"));
        let phase = "initialized";
        if (tasksExists) phase = "tasks";
        else if (planExists) phase = "plan";
        else if (specExists) phase = "spec";
        console.log(`  Phase: ${phase}`);
        console.log(`  Artifacts: spec=${specExists} plan=${planExists} tasks=${tasksExists}`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Command: new
// ─────────────────────────────────────────────────────────────────────────────

interface NewArgs extends CliOptions {
  branch?: string;
}

async function cmdNew(args: NewArgs & { positional: string[] }): Promise<void> {
  const name = args.positional[0];
  if (!name) {
    console.error("Error: Feature name required.");
    console.error("Usage: sdd new <feature-name> [--branch <prefix>]");
    process.exit(1);
  }

  console.log(BANNER);
  console.log(`Creating new workspace: ${name}\n`);

  const repoRoot = getRepoRoot();

  // Determine branch prefix
  let prefix = "feat";
  if (args.branch) {
    prefix = args.branch;
  } else {
    // Auto-detect prefix from name
    const lowerName = name.toLowerCase();
    if (lowerName.includes("fix") || lowerName.includes("bug")) prefix = "fix";
    else if (lowerName.includes("test")) prefix = "test";
    else if (lowerName.includes("refactor")) prefix = "refactor";
    else if (lowerName.includes("init") || lowerName.includes("setup")) prefix = "init";
  }

  const branchName = `${prefix}/${name.replace(/\s+/g, "-").toLowerCase()}`;
  console.log(`Branch: ${branchName}`);
  console.log(`Feature: ${name}`);

  // Create the feature using the script
  const createScript = getScriptPath("create-new-feature.sh");
  if (existsSync(createScript)) {
    try {
      execSync(`bash "${createScript}" "${name}"`, {
        cwd: repoRoot,
        stdio: "inherit",
      });
      console.log(`\n✓ Workspace created: ${name}`);
      console.log(`\nNext: Run 'sdd status' to see the workspace state.`);
    } catch {
      console.error("\n✗ Failed to create workspace.");
      process.exit(1);
    }
  } else {
    // Manual workspace creation
    const specsDir = join(repoRoot, "specs");
    const featureDir = join(specsDir, branchName);

    if (!existsSync(specsDir)) {
      execSync(`mkdir -p "${specsDir}"`, { cwd: repoRoot });
    }

    if (existsSync(featureDir)) {
      console.error(`\n✗ Workspace already exists: ${branchName}`);
      process.exit(1);
    }

    execSync(`mkdir -p "${featureDir}"`, { cwd: repoRoot });
    console.log(`\n✓ Workspace created: ${branchName}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    console.log(BANNER);
    console.log(USAGE);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "init": {
        const { values } = parseArgs({
          args: args.slice(1),
          options: {
            help: { short: "h", type: "boolean" },
          },
          allowPositionals: false,
        });
        await cmdInit(values as InitOptions);
        break;
      }

      case "status": {
        const { values, positionals } = parseArgs({
          args: args.slice(1),
          options: {
            help: { short: "h", type: "boolean" },
            json: { type: "boolean" },
            feature: { type: "string" },
          },
          allowPositionals: false,
        });
        await cmdStatus({ ...values, feature: positionals[0] } as StatusOptions);
        break;
      }

      case "workspaces": {
        const { values } = parseArgs({
          args: args.slice(1),
          options: {
            help: { short: "h", type: "boolean" },
            json: { type: "boolean" },
          },
          allowPositionals: false,
        });
        await cmdWorkspaces(values as WorkspacesOptions);
        break;
      }

      case "new": {
        const { values, positionals } = parseArgs({
          args: args.slice(1),
          options: {
            help: { short: "h", type: "boolean" },
            json: { type: "boolean" },
            branch: { type: "string" },
          },
          allowPositionals: true,
        });
        await cmdNew({ ...values, positional: positionals } as NewArgs & { positional: string[] });
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error(USAGE);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
