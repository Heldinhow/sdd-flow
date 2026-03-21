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
    agent: default
---

# Command content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.handoffs).toBeDefined();
      expect(result!.handoffs!.length).toBeGreaterThan(0);
      expect(result!.handoffs![0].agent).toBe("default");
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
    agent: default
    prompt: |
      Initialize SDD workflow.
---

# Content`;

      const result = parseYamlFrontmatter(content);

      expect(result).not.toBeNull();
      expect(result!.description).toBe("Initialize SDD workflow");
      expect(result!.handoffs).toBeDefined();
      expect(result!.handoffs![0].agent).toBe("default");
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
    agent: default
---

# Content`
      );

      const commands = discoverCommands(testRoot);
      const entry = commands.get("sdd-init");

      expect(entry).toBeDefined();
      expect(entry!.description).toBe("Initialize SDD workflow");
      expect(entry!.agent).toBe("default");

      rmSync(testRoot, { recursive: true, force: true });
    });

    it("returns empty map when command directory does not exist", () => {
      const nonExistentPath = path.join(tmpdir(), "non-existent-dir-" + Date.now());
      rmSync(nonExistentPath, { recursive: true, force: true });

      const commands = discoverCommands(nonExistentPath);

      expect(commands.size).toBe(0);
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
