import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  buildSpecDrivenPrompt,
  injectSddBackendTemplate,
  registerSpecDrivenAgent,
  SDD_SKILL_NAMES,
} from "../../../src/plugin/spec-driven-agent";

describe("spec-driven-agent", () => {
  describe("SDD_SKILL_NAMES", () => {
    it("contains expected skill names", () => {
      expect(SDD_SKILL_NAMES).toContain("sdd-flow");
      expect(SDD_SKILL_NAMES).toContain("sdd-spec");
      expect(SDD_SKILL_NAMES).toContain("sdd-plan");
      expect(SDD_SKILL_NAMES).toContain("sdd-tasks");
      expect(SDD_SKILL_NAMES).toHaveLength(4);
    });
  });

  describe("buildSpecDrivenPrompt", () => {
    it("returns uninitialized message when repo is not initialized", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/project",
        repoInitialized: false,
      });
      expect(prompt).toContain("Repository Not Initialized");
      expect(prompt).toContain("/sdd-init");
      expect(prompt).not.toContain("repo-local skills");
    });

    it("returns full prompt when repo is initialized", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/project",
        repoInitialized: true,
      });
      expect(prompt).toContain("Spec Driven");
      expect(prompt).toContain("repo-local SDD backend");
      expect(prompt).toContain("plan mode");
    });
  });

  describe("registerSpecDrivenAgent", () => {
    it("registers agent with correct configuration", () => {
      const config: Record<string, unknown> = {};
      registerSpecDrivenAgent(config as never, "test prompt");
      const agent = config.agent as Record<string, unknown>;
      expect(agent["Spec Driven"]).toBeDefined();
      expect((agent["Spec Driven"] as Record<string, unknown>).mode).toBe("primary");
      expect((agent["Spec Driven"] as Record<string, unknown>).color).toBe("accent");
    });

    it("does not overwrite existing agent config", () => {
      const config: Record<string, unknown> = { agent: { "Existing Agent": {} } };
      registerSpecDrivenAgent(config as never, "test prompt");
      expect(config.agent).toBeDefined();
    });
  });

  describe("injectSddBackendTemplate", () => {
    it("does nothing for empty user text", () => {
      const output = {
        message: { id: "msg-1", sessionID: "sess-1" },
        parts: [] as { type: string; text: string }[],
      };
      injectSddBackendTemplate("/project", output as never);
      expect(output.parts).toHaveLength(0);
    });

    it("does nothing for slash command input", () => {
      const output = {
        message: { id: "msg-1", sessionID: "sess-1" },
        parts: [{ type: "text", text: "/sdd-init" }],
      };
      injectSddBackendTemplate("/project", output as never);
      expect(output.parts).toHaveLength(1);
    });

    it("adds template when user text is not a slash command", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-template-test-"));
      try {
        mkdirSync(path.join(tempRoot, ".opencode", "command"), { recursive: true });
        writeFileSync(path.join(tempRoot, ".opencode/command/sdd.md"), "SDD backend template content\n");

        const output = {
          message: { id: "msg-1", sessionID: "sess-1" },
          parts: [{ type: "text", text: "plan auth flow" }],
        };
        injectSddBackendTemplate(tempRoot, output as never);
        expect(output.parts.length).toBeGreaterThan(1);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("shows warning when template is missing", () => {
      const tempRoot = mkdtempSync(path.join("/tmp", "sdd-template-test-"));
      try {
        // Don't create the template file
        const output = {
          message: { id: "msg-1", sessionID: "sess-1" },
          parts: [{ type: "text", text: "plan auth flow" }],
        };
        injectSddBackendTemplate(tempRoot, output as never);
        // It should show a warning message about missing template
        expect(output.parts.length).toBeGreaterThan(1);
        expect(output.parts[0]).toBeDefined();
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    });
  });
});
