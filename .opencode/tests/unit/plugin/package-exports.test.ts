import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import sddPlugin, { sddPlugin as namedSddPlugin } from "../../../plugin/sdd";

interface PackageJsonExports {
  "."?: string;
}

interface PackageJson {
  name?: string;
  private?: boolean;
  exports?: PackageJsonExports;
}

function readPackageJson(): PackageJson {
  const packageJsonPath = path.resolve(import.meta.dir, "../../../package.json");

  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
}

describe("published plugin package", () => {
  it("exposes a public scoped npm package entrypoint", () => {
    const packageJson = readPackageJson();

    expect(packageJson.name).toBe("@helldinhow/sdd-flow-opencode-plugin");
    expect(packageJson.private).toBeUndefined();
    expect(packageJson.exports?.["."]).toBe("./plugin/sdd.ts");
  });

  it("provides both default and named plugin exports", () => {
    expect(namedSddPlugin).toBe(sddPlugin);
  });
});
