interface DraftSpecInput {
  branchName?: string;
  prTitle?: string;
  prDescription?: string;
  author?: string;
}

interface DraftSpecOutput {
  featureName: string;
  description: string;
  draftSpecContent: string;
  detectedIntent: string;
  confidence: "high" | "medium" | "low";
}

function extractFeatureName(branchName: string): string {
  if (!branchName) return "";

  // Remove common prefixes
  let cleaned = branchName
    .replace(/^(feat|fix|refactor|test|init|chore|docs|style)\s*[-_]*/i, "")
    .replace(/[-_]/g, " ")
    .trim();

  // Title-case each word
  cleaned = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return cleaned || branchName;
}

function extractFromPrDescription(prDescription: string): {
  title: string;
  context: string;
  acceptanceCriteria: string[];
  edgeCases: string[];
} {
  const lines = prDescription.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = "";
  let context = "";
  const acceptanceCriteria: string[] = [];
  const edgeCases: string[] = [];

  let inAcceptanceCriteria = false;
  let inEdgeCases = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes("acceptance") && lowerLine.includes("criteria")) {
      inAcceptanceCriteria = true;
      inEdgeCases = false;
      continue;
    }

    if (lowerLine.includes("edge case")) {
      inEdgeCases = true;
      inAcceptanceCriteria = false;
      continue;
    }

    if (inAcceptanceCriteria && (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line))) {
      const criterion = line.replace(/^[-*\d.]+\s*/, "").trim();
      if (criterion) acceptanceCriteria.push(criterion);
      continue;
    }

    if (inEdgeCases && (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line))) {
      const edgeCase = line.replace(/^[-*\d.]+\s*/, "").trim();
      if (edgeCase) edgeCases.push(edgeCase);
      continue;
    }

    // Don't include section headers as context
    if (lowerLine.includes("acceptance") || lowerLine.includes("edge case") || lowerLine.includes("---")) {
      continue;
    }

    // First meaningful line is likely the title
    if (!title && line.length > 5 && !line.startsWith("#") && !line.startsWith(">")) {
      title = line;
      continue;
    }

    // Collect context lines (non-bullet, non-marker content)
    if (!inAcceptanceCriteria && !inEdgeCases && line.length > 10) {
      context += (context ? " " : "") + line;
    }
  }

  return { title, context, acceptanceCriteria, edgeCases };
}

function inferIntent(branchName: string, prTitle: string): string {
  const combined = `${branchName} ${prTitle}`.toLowerCase();

  if (/(auth|login|password|credential|jwt|session|oauth|2fa|mfa)/.test(combined)) {
    return "Authentication & Security";
  }
  if (/(api|rest|endpoint|graphql|http)/.test(combined)) {
    return "API Development";
  }
  if (/(ui|frontend|component|button|form|dashboard|page)/.test(combined)) {
    return "Frontend / UI";
  }
  if (/(database|schema|migration|model|table|query)/.test(combined)) {
    return "Data Layer";
  }
  if (/(performance|speed|cache|optimize)/.test(combined)) {
    return "Performance";
  }
  if (/(test|coverage|unit|integration|e2e)/.test(combined)) {
    return "Testing";
  }
  if (/(deploy|ci|cd|pipeline|docker|kubernetes)/.test(combined)) {
    return "DevOps / Infrastructure";
  }
  if (/(fix|bug|repair|correct)/.test(combined)) {
    return "Bug Fix";
  }

  return "Feature";
}

function generateDraftSpec(input: DraftSpecInput): DraftSpecOutput {
  const { branchName = "", prTitle = "", prDescription = "" } = input;

  // Extract feature name from branch or PR title
  const branchFeatureName = extractFeatureName(branchName);
  const prFeatureName = prTitle.trim() || "";

  // Prefer PR title if it has meaningful content, otherwise use branch name
  const featureName = prFeatureName || branchFeatureName || "Untitled Feature";

  // Determine base description
  let description = "";
  let confidence: "high" | "medium" | "low" = "medium";

  if (prDescription) {
    const { title, context, acceptanceCriteria, edgeCases } = extractFromPrDescription(prDescription);
    description = title || context || featureName;
    // High confidence when we have title + content OR title + structured criteria
    const hasStructuredContent = acceptanceCriteria.length > 0 || edgeCases.length > 0;
    confidence = title && (context || hasStructuredContent) ? "high" : "medium";
  } else if (prTitle) {
    description = prTitle;
    confidence = "high";
  } else if (branchName) {
    description = `Feature: ${branchFeatureName}`;
    confidence = "low";
  }

  const intent = inferIntent(branchName, prTitle);
  const date = new Date().toISOString().split("T")[0];

  // Build the draft spec content
  const draftSpecContent = buildDraftSpecContent({
    featureName,
    description,
    intent,
    branchName,
    date,
    prDescription,
  });

  return {
    featureName,
    description,
    draftSpecContent,
    detectedIntent: intent,
    confidence,
  };
}

interface DraftSpecContentInput {
  featureName: string;
  description: string;
  intent: string;
  branchName: string;
  date: string;
  prDescription: string;
}

function buildDraftSpecContent(input: DraftSpecContentInput): string {
  const { featureName, description, intent, branchName, date, prDescription } = input;

  const { acceptanceCriteria, edgeCases } = extractFromPrDescription(prDescription || "");

  const acceptanceCriteriaSection =
    acceptanceCriteria.length > 0
      ? acceptanceCriteria.map((ac, i) => `${i + 1}. **Given** [initial state], **When** [action], **Then** ${ac}`).join("\n")
      : "";

  const edgeCasesSection =
    edgeCases.length > 0
      ? edgeCases.map((ec) => `- What happens when ${ec}?`).join("\n")
      : "";

  return `# Feature Specification: ${featureName}

**Feature Branch**: \`${branchName}\`
**Created**: ${date}
**Status**: Draft
**Input**: User description: "${description}"

> Primary guided workflow: \`/sdd\` (with \`speckit.*\` compatibility wrappers)

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - ${featureName} Core Flow (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: This is the primary user journey and must be functional before release.

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

${acceptanceCriteriaSection || "1. **Given** [initial state], **When** [action], **Then** [expected outcome]"}

---

### User Story 2 - ${featureName} Secondary Flow (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

${edgeCasesSection || "- What happens when [boundary condition]?\n- How does system handle [error scenario]?"}

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability related to: ${intent}]
- **FR-002**: System MUST [specific capability]
- **FR-003**: Users MUST be able to [key interaction]
- **FR-004**: System MUST [data requirement]
- **FR-005**: System MUST [behavior]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
`;
}

export { extractFeatureName, extractFromPrDescription, generateDraftSpec };
export type { DraftSpecInput, DraftSpecOutput };
