import { applyClarifications, type ClarificationAnswer } from "./apply-clarifications";
import { detectAmbiguity, type ClarificationRequest } from "./detect-ambiguity";
import { WORKFLOW_PHASE, type WorkflowPhase } from "./session-state";

interface ClarifyLoopResult {
  phase: WorkflowPhase;
  nextQuestion?: ClarificationRequest;
  updatedContent?: string;
}

function runClarifyLoop(content: string, answers: ClarificationAnswer[] = []): ClarifyLoopResult {
  const requests = detectAmbiguity(content);
  if (requests.length === 0) {
    return {
      phase: WORKFLOW_PHASE.PLAN,
      updatedContent: content,
    };
  }

  const answeredQuestions = new Set(answers.map((answer) => answer.question));
  const nextQuestion = requests.find((request) => !answeredQuestions.has(request.question));
  if (nextQuestion) {
    return {
      phase: WORKFLOW_PHASE.CLARIFY,
      nextQuestion,
    };
  }

  return {
    phase: WORKFLOW_PHASE.PLAN,
    updatedContent: applyClarifications(content, answers, new Date().toISOString().slice(0, 10)),
  };
}

export { runClarifyLoop };
export type { ClarifyLoopResult };
