import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";

interface ImportOptions {
  repoRoot: string;
  bundlePath: string;
  targetName?: string;
  overwrite?: boolean;
}

interface ImportManifest {
  version: "1.0";
  exportedAt: string;
  featureName: string;
  artifacts: string[];
  totalSize: number;
}

interface ImportResult {
  success: boolean;
  importedAs: string;
  artifactsImported: number;
  manifest?: ImportManifest;
  error?: string;
}

function readManifest(bundlePath: string): ImportManifest | null {
  const manifestPath = bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json";

  if (existsSync(manifestPath)) {
    try {
      return JSON.parse(readFileSync(manifestPath, "utf-8"));
    } catch {
      return null;
    }
  }

  return null;
}

async function importWorkspace(options: ImportOptions): Promise<ImportResult> {
  const { repoRoot, bundlePath, targetName, overwrite = false } = options;

  if (!existsSync(bundlePath)) {
    return {
      success: false,
      importedAs: "",
      artifactsImported: 0,
      error: `Bundle not found: ${bundlePath}`,
    };
  }

  // Read manifest
  const manifest = readManifest(bundlePath);
  const originalName = manifest?.featureName || basename(bundlePath).replace(/\.sdd-bundle\.tar\.gz$/, "");
  const importAs = targetName || originalName;

  // Target directory
  const specsDir = join(repoRoot, "specs");
  const targetDir = join(specsDir, importAs);

  if (existsSync(targetDir) && !overwrite) {
    return {
      success: false,
      importedAs: importAs,
      artifactsImported: 0,
      manifest: manifest || undefined,
      error: `Workspace already exists: ${importAs}. Use --overwrite to replace.`,
    };
  }

  // Ensure specs directory exists
  if (!existsSync(specsDir)) {
    mkdirSync(specsDir, { recursive: true });
  }

  // Remove existing directory if overwrite
  if (existsSync(targetDir) && overwrite) {
    rmSync(targetDir, { recursive: true, force: true });
  }

  mkdirSync(targetDir, { recursive: true });

  try {
    // Extract tar.gz using streaming parser
    const gzip = createGunzip();
    const input = createReadStream(bundlePath);

    let artifactsImported = 0;

    // Parse tar entries from the stream
    let buffer = Buffer.alloc(0);
    let streamEnded = false;

    const processBuffer = (): void => {
      let offset = 0;

      while (offset + 512 <= buffer.length) {
        const header = buffer.subarray(offset, offset + 512);

        // Check for empty block (EOF marker - two consecutive 512-byte zero blocks)
        if (header.every((b) => b === 0)) {
          offset += 512;
          if (offset + 512 <= buffer.length && buffer.subarray(offset, offset + 512).every((b) => b === 0)) {
            streamEnded = true;
          }
          continue;
        }

        // Parse tar header
        const nameRaw = header.toString("utf-8", 0, 100).replace(/\0+$/, "").trim();
        const sizeStr = header.toString("ascii", 124, 136).replace(/\0/g, "").trim();
        const size = parseInt(sizeStr, 8) || 0;
        const typeFlag = header.toString("ascii", 156, 157);
        const magic = header.toString("ascii", 257, 262);

        offset += 512;

        // Handle long filenames in USTAR format: prefix + "/" + name
        let name = nameRaw;
        if (magic === "ustar") {
          const prefix = header.toString("utf-8", 345, 500).replace(/\0+$/, "").trim();
          if (prefix) {
            name = prefix + "/" + nameRaw;
          }
        }

        if (!name || typeFlag !== "0") {
          // Skip directory entries or empty entries
          const skipBlocks = Math.ceil(size / 512);
          offset += skipBlocks * 512;
          continue;
        }

        if (size > 0) {
          const contentBlocks = Math.ceil(size / 512);
          const neededBytes = offset + contentBlocks * 512;

          if (neededBytes > buffer.length) {
            // Need more data, keep what we have and wait
            return;
          }

          const content = buffer.subarray(offset, offset + size);
          offset += contentBlocks * 512;

          // Write file
          try {
            const filePath = join(targetDir, name);
            const fileDir = join(filePath, "..");
            mkdirSync(fileDir, { recursive: true });
            writeFileSync(filePath, content);
            artifactsImported++;
          } catch {
            // Ignore file write errors
          }
        }
      }

      // Keep remaining bytes that didn't form a complete entry
      buffer = buffer.subarray(offset);
    };

    await new Promise<void>((resolve, reject) => {
      gzip
        .on("data", (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);
          processBuffer();
        })
        .on("end", () => {
          streamEnded = true;
          processBuffer(); // Process any remaining data
          resolve();
        })
        .on("error", reject);

      input.pipe(gzip);
    });

    return {
      success: artifactsImported > 0,
      importedAs: importAs,
      artifactsImported,
      manifest: manifest || undefined,
      error: artifactsImported === 0 ? "Failed to extract files from bundle" : undefined,
    };
  } catch (err) {
    return {
      success: false,
      importedAs: importAs,
      artifactsImported: 0,
      manifest: manifest || undefined,
      error: String(err),
    };
  }
}

function listWorkspaceBundles(repoRoot: string): string[] {
  if (!existsSync(repoRoot)) return [];

  let entries: string[] = [];
  try {
    entries = readdirSync(repoRoot);
  } catch {
    return [];
  }

  return entries.filter(
    (name) => name.endsWith(".sdd-bundle.tar.gz") || name.endsWith(".sdd-bundle.zip"),
  );
}

export { importWorkspace, readManifest, listWorkspaceBundles };
export type { ImportOptions, ImportManifest, ImportResult };
