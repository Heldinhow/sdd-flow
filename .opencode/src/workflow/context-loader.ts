import { existsSync } from "node:fs";
import path from "node:path";

interface WorkflowArtifacts {
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
}

interface WorkflowContext {
  repoRoot: string;
  activeFeature: string;
  featureRoot: string;
  repoInitialized: boolean;
  artifacts: WorkflowArtifacts;
}

interface LoadWorkflowContextInput {
  repoRoot: string;
  activeFeature: string;
}

function loadWorkflowContext(input: LoadWorkflowContextInput): WorkflowContext {
  const featureRoot = path.join(input.repoRoot, "specs", input.activeFeature);

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
  };
}

export { loadWorkflowContext };
export type { LoadWorkflowContextInput, WorkflowArtifacts, WorkflowContext };
