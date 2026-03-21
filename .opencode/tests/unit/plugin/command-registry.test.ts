import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import { discoverCommands, parseYamlFrontmatter } from "../../../src/plugin/command-registry";

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
  });

  describe("discoverCommands", () => {
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
      const commands = discoverCommands(process.cwd());

      const entry = commands.get("sdd-init");
      expect(entry).toBeDefined();
      expect(entry!.agent).toBe("build");
    });

    it("resolves implement command to build agent", () => {
      const commands = discoverCommands(process.cwd());

      const entry = commands.get("implement");
      expect(entry).toBeDefined();
      expect(entry!.agent).toBe("build");
    });

    it("sets template path correctly", () => {
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
      expect(entry!.template).toBe(".opencode/command/sdd.md");

      rmSync(testRoot, { recursive: true, force: true });
    });
  });
});
