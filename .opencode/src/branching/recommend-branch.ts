import { BRANCH_PREFIX, buildBranchName, cleanShortName, type BranchPrefix } from "./prefixes";

const BRANCH_INTENT = {
  INIT: "init",
  FIX: "fix",
  REFACTOR: "refactor",
  TEST: "test",
  FEAT: "feat",
} as const;

interface BranchRecommendation {
  prefix: BranchPrefix;
  shortName: string;
  branchName: string;
}

function inferBranchPrefix(featureDescription: string): BranchPrefix {
  const normalizedDescription = featureDescription.toLowerCase();

  if (/(bootstrap|initialize|initialise|setup|scaffold)/.test(normalizedDescription)) {
    return BRANCH_PREFIX.INIT;
  }
  if (/(bug|fix|repair|correct)/.test(normalizedDescription)) {
    return BRANCH_PREFIX.FIX;
  }
  if (/(refactor|restructure|cleanup)/.test(normalizedDescription)) {
    return BRANCH_PREFIX.REFACTOR;
  }
  if (/(test|coverage|spec)/.test(normalizedDescription)) {
    return BRANCH_PREFIX.TEST;
  }
  return BRANCH_PREFIX.FEAT;
}

function buildShortName(featureDescription: string): string {
  const normalizedDescription = featureDescription
    .replace(/\b(create|build|make|the|for|with|from|into|initialize|initialise|setup|bootstrap|scaffold)\b/gi, " ")
    .trim();
  return cleanShortName(normalizedDescription).split("-").slice(0, 3).join("-");
}

function recommendBranch(featureDescription: string): BranchRecommendation {
  const prefix = inferBranchPrefix(featureDescription);
  const shortName = buildShortName(featureDescription);

  return {
    prefix,
    shortName,
    branchName: buildBranchName(prefix, shortName),
  };
}

export { BRANCH_INTENT, inferBranchPrefix, recommendBranch };
export type { BranchRecommendation };