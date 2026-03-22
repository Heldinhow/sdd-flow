interface ClarificationAnswer {
  question: string;
  answer: string;
}

function applyClarifications(content: string, answers: ClarificationAnswer[], sessionDate: string): string {
  let updatedContent = content;

  // Deduplicate answers by question text, keeping the last answer for each unique question
  const seenQuestions = new Map<string, ClarificationAnswer>();
  for (const answer of answers) {
    seenQuestions.set(answer.question, answer);
  }
  const uniqueAnswers = Array.from(seenQuestions.values());

  for (const answer of uniqueAnswers) {
    const marker = `[NEEDS CLARIFICATION: ${answer.question}]`;
    updatedContent = updatedContent.replaceAll(marker, answer.answer);
  }

  if (uniqueAnswers.length === 0) {
    return updatedContent;
  }

  const clarificationLines = uniqueAnswers.map(
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
