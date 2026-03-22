import { describe, expect, it, vi, beforeEach } from "bun:test";
import { spawn } from "node:child_process";

import { formatScriptOutput, runScript, PreScriptRunner } from "../../../src/plugin/pre-script-runner";

describe("pre-script-runner", () => {
  describe("formatScriptOutput", () => {
    it("formats successful script output with JSON", () => {
      const result = formatScriptOutput("test-command", {
        stdout: JSON.stringify({ FEATURE_DIR: "/specs/001", AVAILABLE_DOCS: ["spec.md"], BRANCH: "feat-test" }),
        stderr: "",
        exitCode: 0,
        errorKind: "success",
      });
      expect(result).toContain("## Pre-script: test-command");
      expect(result).toContain("**Status**: success");
      expect(result).toContain("**Feature workspace**: /specs/001");
      expect(result).toContain("**Available docs**: spec.md");
      expect(result).toContain("**Branch**: feat-test");
    });

    it("formats error output with stderr", () => {
      const result = formatScriptOutput("test-command", {
        stdout: "",
        stderr: "some error occurred",
        exitCode: 1,
        errorKind: "nonzero",
      });
      expect(result).toContain("**Status**: error (exit 1)");
      expect(result).toContain("**Error output**:");
      expect(result).toContain("some error occurred");
    });

    it("formats non-zero exit without stderr as just error status", () => {
      const result = formatScriptOutput("test-command", {
        stdout: "",
        stderr: "",
        exitCode: 127,
        errorKind: "nonzero",
      });
      expect(result).toContain("**Status**: error (exit 127)");
    });

    it("formats raw output when not JSON", () => {
      const result = formatScriptOutput("test-command", {
        stdout: "some raw text output",
        stderr: "",
        exitCode: 0,
        errorKind: "success",
      });
      expect(result).toContain("**Raw output**:");
      expect(result).toContain("some raw text output");
    });

    it("handles notfound error kind without stderr", () => {
      const result = formatScriptOutput("test-command", {
        stdout: "",
        stderr: "",
        exitCode: -1,
        errorKind: "notfound",
      });
      expect(result).toContain("**Status**: error (exit -1)");
    });

    it("omits error section for notfound errors", () => {
      const result = formatScriptOutput("test-command", {
        stdout: "",
        stderr: "permission denied",
        exitCode: -1,
        errorKind: "notfound",
      });
      expect(result).not.toContain("**Error output**:");
    });
  });

  describe("runScript", () => {
    it("returns success when script exits with code 0", async () => {
      const promise = runScript("echo hello", "/tmp", 5000);
      const result = await promise;
      expect(result.errorKind).toBe("success");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("hello");
    });

    it("returns nonzero when script exits with non-zero code", async () => {
      const promise = runScript("exit 1", "/tmp", 5000);
      const result = await promise;
      expect(result.errorKind).toBe("nonzero");
      expect(result.exitCode).toBe(1);
    });

    it("returns timeout when script exceeds timeout", async () => {
      const promise = runScript("sleep 10", "/tmp", 100);
      const result = await promise;
      expect(result.errorKind).toBe("timeout");
      expect(result.exitCode).toBe(-1);
    });
  });

  describe("PreScriptRunner", () => {
    const mockGetScripts = vi.fn();

    beforeEach(() => {
      mockGetScripts.mockReset();
    });

    it("returns null when no scripts found for command", async () => {
      mockGetScripts.mockReturnValue(null);
      const runner = new PreScriptRunner(mockGetScripts);
      const result = await runner.runIfNeeded("unknown-command", "/tmp");
      expect(result).toBeNull();
      expect(mockGetScripts).toHaveBeenCalledWith("unknown-command");
    });

    it("returns null when scripts exist but no sh property", async () => {
      mockGetScripts.mockReturnValue({ bash: null });
      const runner = new PreScriptRunner(mockGetScripts);
      const result = await runner.runIfNeeded("command-no-sh", "/tmp");
      expect(result).toBeNull();
    });

    it("runs script and returns formatted result", async () => {
      mockGetScripts.mockReturnValue({ sh: "echo test" });
      const runner = new PreScriptRunner(mockGetScripts, 5000);
      const result = await runner.runIfNeeded("test-command", "/tmp");
      expect(result).not.toBeNull();
      expect(result!.commandName).toBe("test-command");
      expect(result!.errorKind).toBe("success");
      expect(result!.stdout).toContain("test");
      expect(result!.formattedOutput).toContain("## Pre-script: test-command");
    });
  });
});