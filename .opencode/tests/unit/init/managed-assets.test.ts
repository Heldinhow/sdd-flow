import { describe, expect, it } from "bun:test";

import {
  MANAGED_ASSET_GROUP,
  MANAGED_ASSET_ROOT,
  buildManagedAssetManifest,
} from "../../../src/init/managed-assets";

describe("managed-assets", () => {
  describe("MANAGED_ASSET_GROUP", () => {
    it("contains all expected groups", () => {
      expect(MANAGED_ASSET_GROUP.COMMAND).toBe("command");
      expect(MANAGED_ASSET_GROUP.RUNTIME).toBe("runtime");
      expect(MANAGED_ASSET_GROUP.SKILL).toBe("skill");
      expect(MANAGED_ASSET_GROUP.SCRIPT).toBe("script");
      expect(MANAGED_ASSET_GROUP.TEMPLATE).toBe("template");
      expect(MANAGED_ASSET_GROUP.MEMORY).toBe("memory");
      expect(MANAGED_ASSET_GROUP.GUIDE).toBe("guide");
    });
  });

  describe("MANAGED_ASSET_ROOT", () => {
    it("contains all expected root paths", () => {
      expect(MANAGED_ASSET_ROOT.OPENCODE_COMMAND).toBe(".opencode/command");
      expect(MANAGED_ASSET_ROOT.OPENCODE_SKILLS).toBe(".opencode/skills");
      expect(MANAGED_ASSET_ROOT.SPECIFY_SCRIPTS).toBe(".specify/scripts/bash");
      expect(MANAGED_ASSET_ROOT.SPECIFY_TEMPLATES).toBe(".specify/templates");
      expect(MANAGED_ASSET_ROOT.SPECIFY_MEMORY).toBe(".specify/memory");
      expect(MANAGED_ASSET_ROOT.GUIDE).toBe("AGENTS.md");
    });
  });

  describe("buildManagedAssetManifest", () => {
    it("returns array of managed assets", () => {
      const manifest = buildManagedAssetManifest("/source");
      expect(Array.isArray(manifest)).toBe(true);
    });

    it("each asset has required properties", () => {
      const manifest = buildManagedAssetManifest("/source");
      if (manifest.length > 0) {
        expect(manifest[0]).toHaveProperty("relativePath");
        expect(manifest[0]).toHaveProperty("sourcePath");
        expect(manifest[0]).toHaveProperty("group");
      }
    });
  });
});