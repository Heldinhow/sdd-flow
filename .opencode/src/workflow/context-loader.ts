import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface WorkflowArtifacts {
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
}

interface FeatureMetadata {
  specApproved: boolean;
  planApproved: boolean;
  lastApprovedAt?: string;
}

interface WorkflowContext {
  repoRoot: string;
  activeFeature: string;
  featureRoot: string;
  repoInitialized: boolean;
  artifacts: WorkflowArtifacts;
  specApproved: boolean;
  planApproved: boolean;
}

interface LoadWorkflowContextInput {
  repoRoot: string;
  activeFeature: string;
}

function getMetadataPath(featureRoot: string): string {
  return path.join(featureRoot, ".feature-meta.json");
}

function loadFeatureMetadata(featureRoot: string): FeatureMetadata {
  const metadataPath = getMetadataPath(featureRoot);
  if (!existsSync(metadataPath)) {
    return { specApproved: false, planApproved: false };
  }
  try {
    const content = readFileSync(metadataPath, "utf-8");
    return JSON.parse(content) as FeatureMetadata;
  } catch {
    return { specApproved: false, planApproved: false };
  }
}

function saveFeatureMetadata(featureRoot: string, metadata: FeatureMetadata): void {
  const metadataPath = getMetadataPath(featureRoot);
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
}

function loadWorkflowContext(input: LoadWorkflowContextInput): WorkflowContext {
  const featureRoot = path.join(input.repoRoot, "specs", input.activeFeature);
  const metadata = loadFeatureMetadata(featureRoot);

  return {
    repoRoot: input.repoRoot,
    activeFeature: input.activeFeature,
    featureRoot,
    repoInitialized: existsSync(path.join(input.repoRoot, ".specify")),
    artifacts: {
      specExists: existsSync(path.join(featureRoot, "spec.md")),
      planExists: existsSync(path.join(featureRoot, "plan.md")),
      tasksExists: existsSync(path.join(featureRoot, "tasks.md")),
    },
    specApproved: metadata.specApproved,
    planApproved: metadata.planApproved,
  };
}

export { loadWorkflowContext, saveFeatureMetadata };
export type { LoadWorkflowContextInput, WorkflowArtifacts, WorkflowContext, FeatureMetadata };
