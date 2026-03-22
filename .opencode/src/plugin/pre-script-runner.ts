import { spawn } from "node:child_process";
import path from "node:path";

import type { CommandScripts } from "./command-registry";

interface PreScriptResult {
  commandName: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  errorKind: "success" | "nonzero" | "notfound" | "timeout" | "unknown";
  formattedOutput: string;
}

interface GetScriptsFn {
  (commandName: string): CommandScripts | null;
}

async function runScript(
  scriptCmd: string,
  repoRoot: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; exitCode: number; errorKind: PreScriptResult["errorKind"] }> {
  return new Promise((resolve) => {
    const proc = spawn("/bin/sh", ["-c", scriptCmd], {
      cwd: repoRoot,
      timeout: timeoutMs,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (result: { stdout: string; stderr: string; exitCode: number; errorKind: PreScriptResult["errorKind"] }) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code: number | null) => {
      settle({
        stdout,
        stderr,
        exitCode: code ?? -1,
        errorKind: code === 0 ? "success" : "nonzero",
      });
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT" || err.code === "EACCES") {
        settle({ stdout, stderr, exitCode: -1, errorKind: "notfound" });
      } else {
        settle({ stdout, stderr, exitCode: -1, errorKind: "unknown" });
      }
    });

    setTimeout(() => {
      if (!settled) {
        proc.kill("SIGKILL");
        settle({ stdout, stderr, exitCode: -1, errorKind: "timeout" });
      }
    }, timeoutMs);
  });
}

function formatScriptOutput(commandName: string, result: {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorKind: PreScriptResult["errorKind"];
}): string {
  const lines: string[] = [];

  lines.push(`## Pre-script: ${commandName}`);
  lines.push("");
  lines.push(`**Status**: ${result.errorKind === "success" ? "success" : `error (exit ${result.exitCode})`}`);

  let parsedJson: Record<string, unknown> | null = null;
  if (result.stdout.trim()) {
    try {
      parsedJson = JSON.parse(result.stdout.trim());
    } catch {
      // not JSON
    }
  }

  if (parsedJson && typeof parsedJson === "object") {
    const fe = parsedJson as Record<string, unknown>;
    if (fe["FEATURE_DIR"]) {
      lines.push(`**Feature workspace**: ${fe["FEATURE_DIR"]}`);
    }
    if (Array.isArray(fe["AVAILABLE_DOCS"])) {
      lines.push(`**Available docs**: ${(fe["AVAILABLE_DOCS"] as string[]).join(", ")}`);
    }
    if (fe["BRANCH"]) {
      lines.push(`**Branch**: ${fe["BRANCH"]}`);
    }
  } else if (result.stdout.trim()) {
    lines.push("**Raw output**:");
    lines.push("```");
    lines.push(result.stdout.trim());
    lines.push("```");
  }

  if (result.errorKind !== "success" && result.errorKind !== "notfound") {
    if (result.stderr.trim()) {
      lines.push("");
      lines.push("**Error output**:");
      lines.push("```");
      lines.push(result.stderr.trim());
      lines.push("```");
    }
  }

  return lines.join("\n");
}

class PreScriptRunner {
  private getScripts: GetScriptsFn;
  private timeoutMs: number;

  constructor(getScripts: GetScriptsFn, timeoutMs = 30_000) {
    this.getScripts = getScripts;
    this.timeoutMs = timeoutMs;
  }

  async runIfNeeded(commandName: string, repoRoot: string): Promise<PreScriptResult | null> {
    const scripts = this.getScripts(commandName);
    if (!scripts || !scripts.sh) {
      return null;
    }

    const result = await runScript(scripts.sh, repoRoot, this.timeoutMs);

    return {
      commandName,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      errorKind: result.errorKind,
      formattedOutput: formatScriptOutput(commandName, result),
    };
  }
}

export { PreScriptRunner, runScript, formatScriptOutput };
export type { PreScriptResult };
