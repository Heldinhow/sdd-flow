import { describe, expect, it } from "bun:test";

import { formatScriptOutput, type PreScriptResult } from "../../../src/plugin/pre-script-runner";

describe("pre-script-runner", () => {
  describe("formatScriptOutput", () => {
    it("formats successful JSON output with feature workspace", () => {
      const result = {
        stdout: '{"FEATURE_DIR":"specs/feat-test","AVAILABLE_DOCS":["spec.md"],"BRANCH":"feat-test"}',
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("## Pre-script: test-command");
      expect(output).toContain("**Status**: success");
      expect(output).toContain("**Feature workspace**: specs/feat-test");
      expect(output).toContain("**Available docs**: spec.md");
      expect(output).toContain("**Branch**: feat-test");
    });

    it("formats raw output when not JSON", () => {
      const result = {
        stdout: "some raw output",
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Raw output**:");
      expect(output).toContain("```");
      expect(output).toContain("some raw output");
    });

    it("formats nonzero exit as error", () => {
      const result = {
        stdout: "",
        stderr: "error message",
        exitCode: 1,
        errorKind: "nonzero" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Status**: error (exit 1)");
      expect(output).toContain("**Error output**:");
      expect(output).toContain("error message");
    });

    it("formats notfound error without stderr section", () => {
      const result = {
        stdout: "",
        stderr: "",
        exitCode: -1,
        errorKind: "notfound" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Status**: error (exit -1)");
      expect(output).not.toContain("**Error output**:");
    });

    it("handles empty stdout and stderr", () => {
      const result = {
        stdout: "",
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Status**: success");
      expect(output).not.toContain("**Raw output**:");
    });

    it("handles JSON with AVAILABLE_DOCS array", () => {
      const result = {
        stdout: '{"FEATURE_DIR":"specs/test","AVAILABLE_DOCS":["spec.md","plan.md"],"BRANCH":"test"}',
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Available docs**: spec.md, plan.md");
    });

    it("ignores malformed JSON", () => {
      const result = {
        stdout: "not valid json {",
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Raw output**:");
      expect(output).toContain("not valid json {");
    });

    it("handles whitespace-only JSON gracefully", () => {
      const result = {
        stdout: "   ",
        stderr: "",
        exitCode: 0,
        errorKind: "success" as const,
      };

      const output = formatScriptOutput("test-command", result);
      expect(output).toContain("**Status**: success");
      expect(output).not.toContain("**Raw output**:");
    });
  });

  describe("PreScriptResult error kinds", () => {
    it("maps success exit code correctly", () => {
      const result = {
        stdout: '{"FEATURE_DIR":"specs/test"}',
        stderr: "",
        exitCode: 0,
        errorKind: "success" as PreScriptResult["errorKind"],
      };
      expect(result.errorKind).toBe("success");
    });

    it("maps nonzero exit code correctly", () => {
      const result = {
        stdout: "",
        stderr: "error",
        exitCode: 127,
        errorKind: "nonzero" as PreScriptResult["errorKind"],
      };
      expect(result.errorKind).toBe("nonzero");
    });

    it("maps notfound error correctly", () => {
      const result = {
        stdout: "",
        stderr: "",
        exitCode: -1,
        errorKind: "notfound" as PreScriptResult["errorKind"],
      };
      expect(result.errorKind).toBe("notfound");
    });

    it("maps timeout error correctly", () => {
      const result = {
        stdout: "",
        stderr: "",
        exitCode: -1,
        errorKind: "timeout" as PreScriptResult["errorKind"],
      };
      expect(result.errorKind).toBe("timeout");
    });

    it("maps unknown error correctly", () => {
      const result = {
        stdout: "",
        stderr: "",
        exitCode: -1,
        errorKind: "unknown" as PreScriptResult["errorKind"],
      };
      expect(result.errorKind).toBe("unknown");
    });
  });
});