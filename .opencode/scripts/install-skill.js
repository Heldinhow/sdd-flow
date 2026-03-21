import { existsSync, mkdirSync, copyFileSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILL_NAME = "sdd-artifact-guard";
const SOURCE_SKILL = join(__dirname, "..", "skills", SKILL_NAME);
const TARGET_DIR = join(process.env.HOME || process.env.USERPROFILE || "~", ".opencode", "skills", SKILL_NAME);

function installSkill() {
  const sourcePath = SOURCE_SKILL.replace(/^~\//, process.env.HOME + "/");
  const targetPath = TARGET_DIR.replace(/^~\//, process.env.HOME + "/");

  if (!existsSync(sourcePath)) {
    console.error(`[${SKILL_NAME}] Source skill not found: ${sourcePath}`);
    process.exit(1);
  }

  const targetParent = dirname(targetPath);
  if (!existsSync(targetParent)) {
    mkdirSync(targetParent, { recursive: true });
  }

  if (existsSync(targetPath)) {
    console.log(`[${SKILL_NAME}] Skill already installed at ${targetPath}`);
    return;
  }

  const sourceStat = statSync(sourcePath);
  if (sourceStat.isDirectory()) {
    copyDirRecursive(sourcePath, targetPath);
  } else {
    mkdirSync(targetPath, { recursive: true });
    copyFileSync(sourcePath, join(targetPath, "SKILL.md"));
  }

  console.log(`[${SKILL_NAME}] Skill installed successfully to ${targetPath}`);
}

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

installSkill();
