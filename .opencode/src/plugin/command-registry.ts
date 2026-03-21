import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Config } from "@opencode-ai/sdk";

export interface CommandScripts {
  sh?: string;
}

interface CommandFrontmatter {
  description?: string;
  agent?: string;
  handoffs?: Array<{
    label: string;
    agent: string;
    prompt?: string;
  }>;
  scripts?: CommandScripts;
}

interface CommandEntry {
  template: string;
  filePath: string;
  description?: string;
  agent?: string;
  scripts?: CommandScripts;
}

const COMMANDS_DIR = [".opencode", "command"] as const;
const BUNDLE_COMMANDS_PATH = ["managed-assets", ".opencode", "command"] as const;

function resolvePackageRoot(): string {
  return path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
}

function resolveCommandsDir(projectRoot: string): string {
  return path.join(projectRoot, ...COMMANDS_DIR);
}

function resolveBundleCommandsDir(): string {
  return path.join(resolvePackageRoot(), ...BUNDLE_COMMANDS_PATH);
}

function parseYamlFrontmatter(content: string): CommandFrontmatter | null {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatterText = frontmatterMatch[1];
  const result: CommandFrontmatter = {};

  const descriptionMatch = frontmatterText.match(/^description:\s*(.+)$/m);
  if (descriptionMatch) {
    result.description = descriptionMatch[1].trim();
  }

  const agentMatch = frontmatterText.match(/^agent:\s*(.+)$/m);
  if (agentMatch) {
    result.agent = agentMatch[1].trim();
  }

  const handoffsMatch = frontmatterText.match(/^handoffs:\s*\n((?:[ \t]+-[^\n]*(?:\n[ \t]+[^\n]+)*\n?)*)/m);
  if (handoffsMatch) {
    const handoffsBlock = handoffsMatch[1];
    const handoffEntries = handoffsBlock.split(/^(?=\s+-\s)/m);

    const handoffs: Array<{ agent: string; label?: string }> = [];

    for (const entry of handoffEntries) {
      if (!entry.trim()) continue;

      const lines = entry.split("\n").filter((l) => l.trim());
      const currentHandoff: { agent?: string; label?: string } = {};

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("- label:")) {
          const labelMatch = trimmed.match(/label:\s*(.+)/);
          if (labelMatch) {
            currentHandoff.label = labelMatch[1].trim();
          }
        } else if (trimmed.startsWith("agent:")) {
          const agentMatch = trimmed.match(/agent:\s*(.+)/);
          if (agentMatch) {
            currentHandoff.agent = agentMatch[1].trim();
          }
        }
      }

      if (currentHandoff.agent) {
        handoffs.push(currentHandoff as { agent: string });
      }
    }

    if (handoffs.length > 0) {
      result.handoffs = handoffs as CommandFrontmatter["handoffs"];
    }
  }

  const scriptsMatch = frontmatterText.match(/^scripts:\s*\n((?:[ \t]+[^\n]*(?:\n[ \t]+[^\n]+)*\n?)*)/m);
  if (scriptsMatch) {
    const scriptsBlock = scriptsMatch[1];
    const scripts: CommandScripts = {};
    const shMatch = scriptsBlock.match(/sh:\s*(.+)/m);
    if (shMatch) {
      scripts.sh = shMatch[1].trim();
    }
    if (Object.keys(scripts).length > 0) {
      result.scripts = scripts;
    }
  }

  return result;
}

function discoverCommands(projectRoot: string): Map<string, CommandEntry> {
  const repoLocalCommandsDir = resolveCommandsDir(projectRoot);
  const commands = new Map<string, CommandEntry>();

  const commandsDir =
    existsSync(repoLocalCommandsDir)
      ? repoLocalCommandsDir
      : resolveBundleCommandsDir();

  if (!existsSync(commandsDir)) {
    return commands;
  }

  const files = readdirSync(commandsDir).filter((f) => f.endsWith(".md")).sort();

  for (const file of files) {
    const commandName = file.replace(/\.md$/, "");
    const filePath = path.join(commandsDir, file);
    const content = readFileSync(filePath, "utf8");

    const frontmatter = parseYamlFrontmatter(content);
    const entry: CommandEntry = {
      template: filePath,
      filePath,
    };

    if (frontmatter?.description) {
      entry.description = frontmatter.description;
    }

    if (frontmatter?.agent) {
      entry.agent = frontmatter.agent;
    }

    if (!entry.agent && frontmatter?.handoffs && frontmatter.handoffs.length > 0) {
      entry.agent = frontmatter.handoffs[0].agent;
    }

    if (frontmatter?.scripts) {
      entry.scripts = frontmatter.scripts;
    }

    commands.set(commandName, entry);
  }

  return commands;
}

function registerCommands(config: Config, projectRoot: string): void {
  const commands = discoverCommands(projectRoot);

  if (commands.size === 0) {
    return;
  }

  config.command ??= {};

  for (const [name, entry] of commands) {
    config.command[name] = {
      template: entry.template,
      description: entry.description,
      agent: entry.agent,
    } as never;
  }
}

export { discoverCommands, parseYamlFrontmatter, registerCommands, resolvePackageRoot };
export type { CommandEntry, CommandFrontmatter };
