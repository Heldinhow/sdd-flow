const WORKFLOW_PHASE = {
  INIT: "init",
  SPECIFY: "specify",
  CLARIFY: "clarify",
  PLAN: "plan",
  TASKS: "tasks",
  COMPLETE: "complete",
} as const;

const ARTIFACT_KIND = {
  SPEC: "spec",
  PLAN: "plan",
  TASKS: "tasks",
} as const;

type WorkflowPhase = (typeof WORKFLOW_PHASE)[keyof typeof WORKFLOW_PHASE];
type ArtifactKind = (typeof ARTIFACT_KIND)[keyof typeof ARTIFACT_KIND];

interface ArtifactState {
  kind: ArtifactKind;
  exists: boolean;
}

interface WorkflowRouteInput {
  repoInitialized: boolean;
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
  hasOutstandingClarifications: boolean;
}

interface WorkflowSessionState {
  phase: WorkflowPhase;
  activeFeature: string;
  artifacts: ArtifactState[];
  nextRecommendation: string;
}

export { ARTIFACT_KIND, WORKFLOW_PHASE };
export type { ArtifactKind, ArtifactState, WorkflowPhase, WorkflowRouteInput, WorkflowSessionState };
