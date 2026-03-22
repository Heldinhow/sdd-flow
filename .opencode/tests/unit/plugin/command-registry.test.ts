import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  discoverCommands,
  extractTemplateContent,
  parseYamlFrontmatter,
  registerCommands,
} from "../../../src/plugin/command-registry";

describe("command-registry", () => {
  describe("parseYamlFrontmatter", () => {
    it("parses description from frontmatter", () => {
      const content = `---
description: Test command description
---

# Command content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.description).toBe("Test command description");
    });

    it("parses handoffs agent from frontmatter", () => {
      const content = `---
description: Test command
handoffs:
  - label: Test Handoff
    agent: build
---

# Command content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.handoffs).toBeDefined();
      expect(result!.handoffs!.length).toBeGreaterThan(0);
      expect(result!.handoffs![0].agent).toBe("build");
    });

    it("returns null for content without frontmatter", () => {
      const content = `# No frontmatter`;

      const result = parseYamlFrontmatter(content);

      expect(result).toBeNull();
    });

    it("handles real command file format", () => {
      const content = `---
description: Initialize SDD workflow
handoffs:
  - label: Initialize Repository
    agent: build
    prompt: |
      Initialize SDD workflow.
---

# Content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.description).toBe("Initialize SDD workflow");
      expect(result!.handoffs).toBeDefined();
      expect(result!.handoffs![0].agent).toBe("build");
    });

    it("parses scripts.sh from frontmatter", () => {
      const content = `---
description: Execute implementation
scripts:
  sh: .specify/scripts/bash/check-prerequisites.sh --json --require-tasks
---

# Content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.scripts).toBeDefined();
      expect(result!.scripts!.sh).toBe(".specify/scripts/bash/check-prerequisites.sh --json --require-tasks");
    });

    it("returns undefined scripts when not present", () => {
      const content = `---
description: Simple command
---

# Content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.scripts).toBeUndefined();
    });

    it("extracts template content without frontmatter", () => {
      const content = `---
description: Simple command
agent: build
---

# Command Body

Run this command.`;

      expect(extractTemplateContent(content)).toBe(`# Command Body

Run this command.`);
    });
  });

  describe("discoverCommands", () => {
    // Call discoverCommands once at the top and reuse for tests that need process.cwd()
    const cwdCommands = discoverCommands(process.cwd());

    it("discovers .md files in command directory", () => {
      const testRoot = path.join(tmpdir(), "sdd-command-test-" + Date.now());
      rmSync(testRoot, { recursive: true, force: true });
      mkdirSync(path.join(testRoot, ".opencode", "command"), { recursive: true });

      writeFileSync(
        path.join(testRoot, ".opencode", "command", "test-cmd.md"),
        `---
description: Test command
---

# Content`
      );

      const commands = discoverCommands(testRoot);

      expect(commands.size).toBeGreaterThanOrEqual(1);
      expect(commands.has("test-cmd")).toBe(true);

      rmSync(testRoot, { recursive: true, force: true });
    });

    it("extracts description and agent from frontmatter", () => {
      const testRoot = path.join(tmpdir(), "sdd-command-test-" + Date.now());
      rmSync(testRoot, { recursive: true, force: true });
      mkdirSync(path.join(testRoot, ".opencode", "command"), { recursive: true });

      writeFileSync(
        path.join(testRoot, ".opencode", "command", "sdd-init.md"),
        `---
description: Initialize SDD workflow
handoffs:
  - label: Initialize
    agent: build
---

# Content`
      );

      const commands = discoverCommands(testRoot);
      const entry = commands.get("sdd-init");

      expect(entry).toBeDefined();
      expect(entry!.description).toBe("Initialize SDD workflow");
      expect(entry!.agent).toBe("build");

      rmSync(testRoot, { recursive: true, force: true });
    });

    it("falls back to bundled commands when repo-local command directory is absent", () => {
      const testRoot = path.join(tmpdir(), "sdd-bundle-fallback-" + Date.now());
      rmSync(testRoot, { recursive: true, force: true });
      mkdirSync(testRoot, { recursive: true });

      const commands = discoverCommands(testRoot);

      expect(commands.size).toBeGreaterThan(0);
      expect(commands.has("sdd")).toBe(true);
      expect(commands.has("sdd-init")).toBe(true);
      expect(commands.has("implement")).toBe(true);

      rmSync(testRoot, { recursive: true, force: true });
    });

    it("resolves sdd-init command to build agent", () => {
      const entry = cwdCommands.get("sdd-init");
      expect(entry).toBeDefined();
      expect(entry!.agent).toBe("build");
    });

    it("resolves implement command to build agent", () => {
      const entry = cwdCommands.get("implement");
      expect(entry).toBeDefined();
      expect(entry!.agent).toBe("build");
    });

    it("resolves implement command has scripts metadata", () => {
      const entry = cwdCommands.get("implement");
      expect(entry).toBeDefined();
      expect(entry!.scripts).toBeDefined();
      expect(entry!.scripts!.sh).toContain("check-prerequisites.sh");
      expect(entry!.scripts!.sh).toContain("--require-tasks");
    });

    it("stores command template content instead of a file path", () => {
      const testRoot = path.join(tmpdir(), "sdd-command-test-" + Date.now());
      rmSync(testRoot, { recursive: true, force: true });
      mkdirSync(path.join(testRoot, ".opencode", "command"), { recursive: true });

      writeFileSync(
        path.join(testRoot, ".opencode", "command", "sdd.md"),
        `---
description: SDD command
---

# Content`
      );

      const commands = discoverCommands(testRoot);
      const entry = commands.get("sdd");

      expect(entry).toBeDefined();
      expect(entry!.template).toBe("# Content");
      expect(entry!.template).not.toContain(".opencode/command/sdd.md");

      rmSync(testRoot, { recursive: true, force: true });
    });

    it("registers bundled commands with template content before repo init", () => {
      const testRoot = path.join(tmpdir(), "sdd-bundle-config-" + Date.now());
      rmSync(testRoot, { recursive: true, force: true });
      mkdirSync(testRoot, { recursive: true });

      const config = {} as Parameters<typeof registerCommands>[0];
      registerCommands(config, testRoot);

      expect(config.command).toBeDefined();
      expect(config.command?.["sdd"]).toBeUndefined();
      expect(config.command?.["sdd-init"]).toBeDefined();
      expect(config.command?.["sdd-init"]?.template).toContain("## User Input");
      expect(config.command?.["sdd-init"]?.template).not.toContain(".opencode/command/sdd-init.md");

      rmSync(testRoot, { recursive: true, force: true });
    });
  });
});
