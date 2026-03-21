interface ClarificationAnswer {
  question: string;
  answer: string;
}

function applyClarifications(content: string, answers: ClarificationAnswer[], sessionDate: string): string {
  let updatedContent = content;

  for (const answer of answers) {
    const marker = `[NEEDS CLARIFICATION: ${answer.question}]`;
    updatedContent = updatedContent.replace(marker, answer.answer);
  }

  if (answers.length === 0) {
    return updatedContent;
  }

  const clarificationLines = answers.map(
    (answer) => `- Q: ${answer.question} -> A: ${answer.answer}`,
  );
  const clarificationSection = `## Clarifications\n\n### Session ${sessionDate}\n${clarificationLines.join("\n")}`;

  if (updatedContent.includes("## Clarifications")) {
    return `${updatedContent}\n${clarificationLines.join("\n")}`;
  }

  return `${updatedContent}\n\n${clarificationSection}`;
}

export { applyClarifications };
export type { ClarificationAnswer };
