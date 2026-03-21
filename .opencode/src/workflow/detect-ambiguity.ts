interface ClarificationRequest {
  marker: string;
  question: string;
}

function detectAmbiguity(content: string): ClarificationRequest[] {
  return [...content.matchAll(/\[NEEDS CLARIFICATION:([^\]]+)\]/g)].map((match) => ({
    marker: match[0],
    question: match[1].trim(),
  }));
}

export { detectAmbiguity };
export type { ClarificationRequest };
