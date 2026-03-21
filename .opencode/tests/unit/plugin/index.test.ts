import { describe, expect, it } from "bun:test";
import { chmodSync, mkdtempSync, mkdirSync } from "node:fs";
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
    expect(output.system.join("\n")).toContain("internal repo-local SDD backend");
    expect(output.system.join("\n")).toContain("feat");
  });

  it("does not register /sdd as a public command", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-commands-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const config = { agent: {}, command: {} } as PluginConfigInput & { command: Record<string, unknown> };

    await hooks.config?.(config);

    expect(config.command.sdd).toBeUndefined();
    expect(config.command["sdd-init"]).toBeDefined();
    expect(config.command.implement).toBeDefined();
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

  it("does NOT inject the /sdd template when user input starts with a slash command", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-slash-"));
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
          text: "/implement",
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

    expect(output.parts.length).toBe(1);
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "/implement",
    });
  });

  it("runs pre-scripts through command.execute.before for slash commands", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-command-hook-"));
    mkdirSync(path.join(projectRoot, ".specify", "scripts", "bash"), { recursive: true });
    mkdirSync(path.join(projectRoot, "specs"));
    await Bun.write(
      path.join(projectRoot, ".specify", "scripts", "bash", "check-prerequisites.sh"),
      "#!/bin/sh\nprintf '%s\\n' '{\"FEATURE_DIR\":\"/tmp/feat-auth\",\"AVAILABLE_DOCS\":[\"tasks.md\",\"plan.md\"]}'\n",
    );
    chmodSync(path.join(projectRoot, ".specify", "scripts", "bash", "check-prerequisites.sh"), 0o755);

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const output = {
      parts: [],
    } as Parameters<NonNullable<PluginHooks["command.execute.before"]>>[1];

    await hooks["command.execute.before"]?.(
      {
        command: "implement",
        sessionID: "session_1",
        arguments: "",
      },
      output,
    );

    expect(output.parts).toHaveLength(1);
    expect(output.parts[0]).toMatchObject({
      type: "text",
      synthetic: true,
      sessionID: "session_1",
    });
    expect("text" in output.parts[0] ? output.parts[0].text : "").toContain("Feature workspace");
    expect("text" in output.parts[0] ? output.parts[0].text : "").toContain("/tmp/feat-auth");
    expect("text" in output.parts[0] ? output.parts[0].text : "").toContain("tasks.md, plan.md");
  });

  it("does not add pre-script context for commands without scripts", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-command-noscript-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));
    mkdirSync(path.join(projectRoot, ".opencode", "command"), { recursive: true });
    await Bun.write(
      path.join(projectRoot, ".opencode", "command", "custom.md"),
      `---
description: Custom command
agent: build
---

# Content`,
    );

    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const output = {
      parts: [],
    } as Parameters<NonNullable<PluginHooks["command.execute.before"]>>[1];

    await hooks["command.execute.before"]?.(
      {
        command: "custom",
        sessionID: "session_1",
        arguments: "",
      },
      output,
    );

    expect(output.parts).toHaveLength(0);
  });

  it("does NOT inject the /sdd template for slash commands with arguments", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-slash-args-"));
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
          text: "/sdd-init my repo",
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

    expect(output.parts.length).toBe(1);
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "/sdd-init my repo",
    });
  });

  it("shows warning prompt for uninitialized repo", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-uninit-"));
    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const config = { agent: {} } as PluginConfigInput;

    await hooks.config?.(config);

    const agentConfig = config.agent?.["Spec Driven"] as { prompt?: string };
    expect(agentConfig.prompt).toContain("Repository Not Initialized");
    expect(agentConfig.prompt).toContain("/sdd-init");
    expect(agentConfig.prompt).toContain("Switch to the build agent");
  });

  it("shows normal prompt for initialized repo", async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-init-"));
    mkdirSync(path.join(projectRoot, ".specify"));
    mkdirSync(path.join(projectRoot, "specs"));
    const hooks = await sddPlugin(createPluginInput(projectRoot));
    const config = { agent: {} } as PluginConfigInput;

    await hooks.config?.(config);

    const agentConfig = config.agent?.["Spec Driven"] as { prompt?: string };
    expect(agentConfig.prompt).toContain("Spec Driven");
    expect(agentConfig.prompt).toContain("SDD workflow");
    expect(agentConfig.prompt).not.toContain("Repository Not Initialized");
  });
});
