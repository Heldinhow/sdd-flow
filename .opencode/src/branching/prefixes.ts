const BRANCH_PREFIX = {
  FEAT: "feat",
  FIX: "fix",
  REFACTOR: "refactor",
  INIT: "init",
  TEST: "test",
} as const;

const DEFAULT_BRANCH_PREFIX = BRANCH_PREFIX.FEAT;
const BRANCH_PREFIX_VALUES = Object.values(BRANCH_PREFIX);

type BranchPrefix = (typeof BRANCH_PREFIX)[keyof typeof BRANCH_PREFIX];

function cleanShortName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isBranchPrefix(value: string): value is BranchPrefix {
  return BRANCH_PREFIX_VALUES.includes(value as BranchPrefix);
}

function normalizeBranchPrefix(value?: string): BranchPrefix {
  if (!value) {
    return DEFAULT_BRANCH_PREFIX;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (!isBranchPrefix(normalizedValue)) {
    throw new Error(`Unsupported branch prefix: ${value}`);
  }

  return normalizedValue;
}

function buildBranchName(prefix: string | undefined, shortName: string): string {
  const normalizedShortName = cleanShortName(shortName);
  if (!normalizedShortName) {
    throw new Error("Short name must contain at least one alphanumeric character");
  }

  return `${normalizeBranchPrefix(prefix)}-${normalizedShortName}`;
}

export {
  BRANCH_PREFIX,
  BRANCH_PREFIX_VALUES,
  DEFAULT_BRANCH_PREFIX,
  buildBranchName,
  cleanShortName,
  isBranchPrefix,
  normalizeBranchPrefix,
};
export type { BranchPrefix };
