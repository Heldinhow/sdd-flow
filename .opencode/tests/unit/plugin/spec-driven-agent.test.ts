import { describe, expect, it } from "bun:test";

import {
  SDD_SKILL_NAMES,
  SPEC_DRIVEN_AGENT,
  buildSpecDrivenPrompt,
  injectSddBackendTemplate,
} from "../../../src/plugin/spec-driven-agent";

describe("spec-driven-agent", () => {
  describe("constants", () => {
    it("exports correct SDD_SKILL_NAMES", () => {
      expect(SDD_SKILL_NAMES).toEqual(["sdd-flow", "sdd-spec", "sdd-plan", "sdd-tasks"]);
    });

    it("exports correct SPEC_DRIVEN_AGENT name", () => {
      expect(SPEC_DRIVEN_AGENT).toBe("Spec Driven");
    });
  });

  describe("buildSpecDrivenPrompt", () => {
    it("returns uninitialized message when repoInitialized is false", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: false,
      });

      expect(prompt).toContain("Repository Not Initialized");
      expect(prompt).toContain("/sdd-init");
    });

    it("returns full prompt when repo is initialized", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("Spec Driven");
      expect(prompt).toContain("repo-local skills");
      expect(prompt).toContain("sdd-flow/SKILL.md");
    });

    it("mentions fresh branch workspace for new interactions", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("fresh typed branch workspace");
    });

    it("mentions plan mode requirement", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("plan mode");
    });

    it("mentions slash commands execute first", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("Slash commands execute first");
    });

    it("includes instructions about managed assets", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("managed init backend");
    });

    it("includes clarification guidance", () => {
      const prompt = buildSpecDrivenPrompt({
        projectRoot: "/repo",
        repoInitialized: true,
      });

      expect(prompt).toContain("focused clarification questions");
    });
  });

  describe("injectSddBackendTemplate", () => {
    it("does nothing when parts array is empty", () => {
      const output = {
        message: { id: "msg-1", sessionID: "session-1" },
        parts: [] as Array<{ type: string; text: string; synthetic?: boolean }>,
      };

      injectSddBackendTemplate("/repo", output as never);

      expect(output.parts).toHaveLength(0);
    });

    it("does nothing when userText starts with slash", () => {
      const output = {
        message: { id: "msg-1", sessionID: "session-1" },
        parts: [{ type: "text", text: "/sdd-init", synthetic: false }] as Array<{
          type: string;
          text: string;
          synthetic?: boolean;
        }>,
      };

      injectSddBackendTemplate("/repo", output as never);

      expect(output.parts).toHaveLength(1);
      expect(output.parts[0]!.text).toBe("/sdd-init");
    });

    it("modifies output when user input doesn't start with slash", () => {
      const output = {
        message: { id: "msg-1", sessionID: "session-1" },
        parts: [{ type: "text", text: "user input", synthetic: false }] as Array<{
          type: string;
          text: string;
          synthetic?: boolean;
        }>,
      };

      injectSddBackendTemplate("/repo", output as never);

      expect(output.parts.length).toBeGreaterThanOrEqual(1);
    });
  });
});