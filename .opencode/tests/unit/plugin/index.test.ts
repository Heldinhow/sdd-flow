import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { PluginInput } from "@opencode-ai/plugin";
import type { Model } from "@opencode-ai/sdk";

import sddPlugin from "../../../src/plugin/index";

function createPluginInput(directory: string): PluginInput {
  return {
    client: {} as PluginInput["client"],
    project: {} as PluginInput["project"],
    directory,
    worktree: directory,
    serverUrl: new URL("http://localhost:4096"),
    $: {} as PluginInput["$"],
  };
}

describe("sdd plugin", () => {
  it("injects the resolved SDD repo root into shell commands", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const output = { env: {} as Record<string, string> };

    await hooks["shell.env"]!({ cwd: projectRoot }, output);

    expect(output.env.SPECIFY_REPO_ROOT).toBe(projectRoot);
    expect(output.env.SDD_PRIMARY_COMMAND).toBe("sdd");
  });

  it("adds unified workflow guidance to the system prompt", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const output = { system: [] as string[] };

    await hooks["experimental.chat.system.transform"]!(
      { model: {} as Model },
      output,
    );

    expect(output.system.join("\n")).toContain("/sdd");
    expect(output.system.join("\n")).toContain("feat");
  });
});
