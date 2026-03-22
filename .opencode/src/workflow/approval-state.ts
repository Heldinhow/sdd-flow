import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

interface ApprovalState {
  specApproved: boolean;
  planApproved: boolean;
}

interface FeatureApprovals {
  [featureName: string]: ApprovalState;
}

const APPROVALS_DIR = ".specify/memory";
const APPROVALS_FILE = "approvals.json";

function getApprovalsPath(repoRoot: string): string {
  return path.join(repoRoot, APPROVALS_DIR, APPROVALS_FILE);
}

function ensureApprovalsDir(repoRoot: string): void {
  const dir = path.join(repoRoot, APPROVALS_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadApprovals(repoRoot: string): FeatureApprovals {
  const filePath = getApprovalsPath(repoRoot);
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content) as FeatureApprovals;
  } catch {
    return {};
  }
}

function saveApprovals(repoRoot: string, approvals: FeatureApprovals): void {
  ensureApprovalsDir(repoRoot);
  const filePath = getApprovalsPath(repoRoot);
  writeFileSync(filePath, JSON.stringify(approvals, null, 2), "utf8");
}

function loadFeatureApproval(repoRoot: string, featureName: string): ApprovalState {
  const approvals = loadApprovals(repoRoot);
  return approvals[featureName] ?? { specApproved: false, planApproved: false };
}

function saveFeatureApproval(repoRoot: string, featureName: string, state: ApprovalState): void {
  const approvals = loadApprovals(repoRoot);
  approvals[featureName] = state;
  saveApprovals(repoRoot, approvals);
}

export { loadFeatureApproval, saveFeatureApproval };
export type { ApprovalState, FeatureApprovals };
