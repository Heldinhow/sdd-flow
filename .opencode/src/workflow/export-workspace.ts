import { createWriteStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createGzip } from "node:zlib";
import { join, relative } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

interface ExportOptions {
  repoRoot: string;
  featureName: string;
  outputPath?: string;
}

interface ExportManifest {
  version: "1.0";
  exportedAt: string;
  featureName: string;
  artifacts: string[];
  totalSize: number;
}

interface ExportResult {
  success: boolean;
  bundlePath: string;
  manifest: ExportManifest;
  error?: string;
}

function collectFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip .git and node_modules
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      files.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files.sort();
}

async function exportWorkspace(options: ExportOptions): Promise<ExportResult> {
  const { repoRoot, featureName, outputPath } = options;

  const workspaceDir = join(repoRoot, "specs", featureName);

  if (!existsSync(workspaceDir)) {
    return {
      success: false,
      bundlePath: "",
      manifest: { version: "1.0", exportedAt: "", featureName, artifacts: [], totalSize: 0 },
      error: `Workspace not found: ${featureName}`,
    };
  }

  // Determine output path
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultOutput = join(repoRoot, `${featureName}-${timestamp}.sdd-bundle.tar.gz`);
  const bundlePath = outputPath || defaultOutput;

  // Collect files
  const files = collectFiles(workspaceDir, workspaceDir);

  if (files.length === 0) {
    return {
      success: false,
      bundlePath: "",
      manifest: { version: "1.0", exportedAt: "", featureName, artifacts: [], totalSize: 0 },
      error: "Workspace has no files to export",
    };
  }

  // Calculate total size
  let totalSize = 0;
  for (const file of files) {
    const fullPath = join(workspaceDir, file);
    totalSize += statSync(fullPath).size;
  }

  // Create manifest
  const manifest: ExportManifest = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    featureName,
    artifacts: files,
    totalSize,
  };

  // Write manifest next to bundle
  const manifestPath = bundlePath.replace(/\.tar\.gz$/, "") + ".manifest.json";
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  // Create tar.gz archive
  try {
    const gzip = createGzip();
    const output = createWriteStream(bundlePath);
    gzip.pipe(output);

    // Write tar entries
    for (const file of files) {
      const fullPath = join(workspaceDir, file);
      const content = readFileSync(fullPath);
      const entry = createTarEntry(file, content);
      await streamWrite(gzip, entry);
    }

    // Write two empty 512-byte blocks for tar EOF
    await streamWrite(gzip, Buffer.alloc(1024));

    await new Promise<void>((resolve, reject) => {
      output.on("finish", resolve);
      output.on("error", reject);
      gzip.end();
    });

    return { success: true, bundlePath, manifest };
  } catch (err) {
    return {
      success: false,
      bundlePath: "",
      manifest,
      error: String(err),
    };
  }
}

function streamWrite(stream: NodeJS.WritableStream, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(data, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function createTarEntry(name: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  const nameBytes = Buffer.from(name.slice(0, 100) + "\0", "utf-8");
  nameBytes.copy(header, 0);

  // File mode (100-108): 0644 (octal)
  header.write("0000644\0", 100, 8, "ascii");
  // Owner UID (108-116): 0
  header.write("0000000\0", 108, 8, "ascii");
  // Group GID (116-124): 0
  header.write("0000000\0", 116, 8, "ascii");
  // File size (124-136): content length in octal
  const sizeOctal = content.length.toString(8).padStart(11, "0") + "\0";
  header.write(sizeOctal, 124, 12, "ascii");
  // Mod time (136-148): now in octal
  const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0";
  header.write(mtimeOctal, 136, 12, "ascii");
  // Checksum placeholder (148-156)
  header.write("        ", 148, 8, "ascii");
  // Type flag (156): regular file
  header.write("0", 156, 1, "ascii");
  // Link name (157-257): empty for regular file
  header.write("\0", 157, 100, "ascii");
  // Magic (257-263): "ustar\0"
  header.write("ustar\0", 257, 6, "ascii");
  // Version (263-265): "00"
  header.write("00", 263, 2, "ascii");
  // Owner name (265-297): "root"
  header.write("root\0", 265, 32, "ascii");
  // Group name (297-329): "root"
  header.write("root\0", 297, 32, "ascii");
  // Device major (329-337): 0
  header.write("0000000\0", 329, 8, "ascii");
  // Device minor (337-345): 0
  header.write("0000000\0", 337, 8, "ascii");

  // Calculate checksum (sum of all 512 header bytes)
  let sum = 0;
  for (let i = 0; i < 512; i++) {
    sum += header[i];
  }
  const checksumOctal = sum.toString(8).padStart(6, "0") + "\0 ";
  header.write(checksumOctal, 148, 8, "ascii");

  // Combine header + content + padding
  const contentSize = content.length;
  const paddedSize = Math.ceil(contentSize / 512) * 512;
  const padding = Buffer.alloc(paddedSize - contentSize);

  return Buffer.concat([header, content, padding]);
}

export { exportWorkspace };
export type { ExportOptions, ExportManifest, ExportResult };
