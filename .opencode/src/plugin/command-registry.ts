import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

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
const INTERNAL_ONLY_COMMANDS = new Set(["sdd"]);

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

  try {
    const parsed = parseYaml(frontmatterText);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const result: CommandFrontmatter = {};

    if (typeof parsed.description === "string") {
      result.description = parsed.description;
    }

    if (typeof parsed.agent === "string") {
      result.agent = parsed.agent;
    }

    if (Array.isArray(parsed.handoffs)) {
      const handoffs: Array<{ agent: string; label?: string }> = [];

      for (const handoff of parsed.handoffs) {
        if (typeof handoff !== "object" || handoff === null) {
          continue;
        }

        if (typeof handoff.agent !== "string") {
          continue;
        }

        handoffs.push({
          agent: handoff.agent,
          label: typeof handoff.label === "string" ? handoff.label : undefined,
        });
      }

      if (handoffs.length > 0) {
        result.handoffs = handoffs as CommandFrontmatter["handoffs"];
      }
    }

    if (typeof parsed.scripts === "object" && parsed.scripts !== null) {
      const scripts: CommandScripts = {};

      if (typeof parsed.scripts.sh === "string") {
        scripts.sh = parsed.scripts.sh;
      }

      if (Object.keys(scripts).length > 0) {
        result.scripts = scripts;
      }
    }

    return result;
  } catch {
    // Fall back to null on parse failure — preserves old behavior
    return null;
  }
}

function extractTemplateContent(content: string): string {
  const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!frontmatterMatch) {
    return content;
  }

  return content.slice(frontmatterMatch[0].length).replace(/^\r?\n/, "");
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
      template: extractTemplateContent(content),
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
    if (INTERNAL_ONLY_COMMANDS.has(name)) {
      continue;
    }

    config.command[name] = {
      template: entry.template,
      description: entry.description,
      agent: entry.agent,
    } as never;
  }
}

export { discoverCommands, extractTemplateContent, parseYamlFrontmatter, registerCommands, resolvePackageRoot };
export type { CommandEntry, CommandFrontmatter };
