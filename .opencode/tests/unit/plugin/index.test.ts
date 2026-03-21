import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { PluginInput } from "@opencode-ai/plugin";
import type { Model } from "@opencode-ai/sdk";

import sddPlugin from "../../../src/plugin/index";

type PluginHooks = Awaited<ReturnType<typeof sddPlugin>>;
type PluginConfigInput = Parameters<NonNullable<PluginHooks["config"]>>[0];

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
  it("registers the Spec Driven primary agent with restricted permissions", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const config = { agent: {} } as PluginConfigInput;

    await hooks.config?.(config);

    expect(config.agent?.["Spec Driven"]).toMatchObject({
      mode: "primary",
      description: expect.stringContaining("SDD"),
      permission: {
        edit: {
          "*": "deny",
          "specs/**/*.md": "allow",
        },
        bash: {
          "*": "deny",
          "*check-prerequisites.sh*": "allow",
          "*create-new-feature.sh*": "allow",
          "*setup-plan.sh*": "allow",
        },
      },
    });
  });

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

    expect(output.system.join("\n")).toContain("Spec Driven");
    expect(output.system.join("\n")).toContain("/sdd");
    expect(output.system.join("\n")).toContain("feat");
  });

  it("injects the repo-local /sdd backend template for Spec Driven messages", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));
    mkdirSync(path.join(projectRoot, ".opencode", "command"), { recursive: true });
    await Bun.write(path.join(projectRoot, ".opencode", "command", "sdd.md"), "Run /sdd with $ARGUMENTS\n");

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const output = {
      message: { id: "message_1", sessionID: "session_1" },
      parts: [
        {
          id: "part_1",
          sessionID: "session_1",
          messageID: "message_1",
          type: "text",
          text: "plan auth flow",
        },
      ],
    } as Parameters<NonNullable<PluginHooks["chat.message"]>>[1];

    await hooks["chat.message"]?.(
      {
        sessionID: "session_1",
        agent: "Spec Driven",
      },
      output,
    );

    expect(output.parts[0]).toMatchObject({
      type: "text",
      synthetic: true,
    });
    expect("id" in output.parts[0] ? output.parts[0].id : "").toStartWith("prt");
    expect("text" in output.parts[0] ? output.parts[0].text : "").toContain("Run /sdd with plan auth flow");
  });
});
