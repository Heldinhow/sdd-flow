interface SpecSection {
  name: string;
  required: boolean;
  found: boolean;
  content: string;
}

interface QualityFinding {
  severity: "critical" | "high" | "medium" | "low";
  category: "structure" | "acceptance-criteria" | "user-story" | "requirements" | "clarity";
  location: string;
  summary: string;
  recommendation: string;
}

interface SpecReviewResult {
  score: number;
  findings: QualityFinding[];
  sectionsFound: string[];
  sectionsMissing: string[];
  userStoriesReviewed: number;
  requirementsReviewed: number;
  acceptanceCriteriaReviewed: number;
}

const REQUIRED_SECTIONS = [
  "User Scenarios & Testing",
  "Requirements",
  "Success Criteria",
];

function reviewSpecQuality(specContent: string): SpecReviewResult {
  const findings: QualityFinding[] = [];
  const lines = specContent.split("\n");

  // Check for required sections
  const sections = detectSections(specContent);
  const sectionsMissing = REQUIRED_SECTIONS.filter(
    (s) => !sections.some((sec) => sec.toLowerCase().includes(s.toLowerCase())),
  );

  if (sectionsMissing.length > 0) {
    findings.push({
      severity: "critical",
      category: "structure",
      location: "top-level",
      summary: `Missing required sections: ${sectionsMissing.join(", ")}`,
      recommendation: "Add all required sections to the spec before proceeding.",
    });
  }

  // Check acceptance criteria
  const acceptanceCriteriaFindings = checkAcceptanceCriteria(specContent);
  findings.push(...acceptanceCriteriaFindings);

  // Check user stories
  const userStoryFindings = checkUserStories(specContent);
  findings.push(...userStoryFindings);

  // Check requirements
  const requirementFindings = checkRequirements(specContent);
  findings.push(...requirementFindings);

  // Check for placeholders
  const placeholderFindings = checkPlaceholders(specContent);
  findings.push(...placeholderFindings);

  // Calculate score
  const score = calculateScore(findings);

  return {
    score,
    findings,
    sectionsFound: sections,
    sectionsMissing,
    userStoriesReviewed: countUserStories(specContent),
    requirementsReviewed: countRequirements(specContent),
    acceptanceCriteriaReviewed: countAcceptanceCriteria(specContent),
  };
}

function detectSections(content: string): string[] {
  const sectionPattern = /^##\s+(.+)$/;
  const lines = content.split("\n");
  const sections: string[] = [];

  for (const line of lines) {
    const match = line.match(sectionPattern);
    if (match) {
      sections.push(match[1].trim());
    }
  }

  return sections;
}

function checkAcceptanceCriteria(content: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const lines = content.split("\n");

  // Look for acceptance criteria pattern: "Given...When...Then"
  const givenWhenThenPattern = /Given\s+.+\s+When\s+.+\s+Then\s+.+/gi;
  const matches = content.match(givenWhenThenPattern) || [];

  // Find lines that look like acceptance criteria but lack measurability
  const measurablePatterns = [
    /under\s+\d+/i,
    /less\s+than\s+\d+/i,
    /greater\s+than\s+\d+/i,
    /%\s+of/i,
    /\d+\s+users?/i,
    /\d+\s+second/i,
    /\d+\s+minute/i,
    /successfully\s+complete/i,
  ];

  const nonMeasurablePatterns = [
    /fast/i,
    /quick/i,
    /good/i,
    /efficient/i,
    /robust/i,
    /secure/i,
    /intuitive/i,
    /scalable/i,
  ];

  const linesWithCriteria = lines.filter((l) => l.match(/When|Then|Acceptance/i));

  for (let i = 0; i < linesWithCriteria.length; i++) {
    const line = linesWithCriteria[i];

    if (nonMeasurablePatterns.some((p) => p.test(line))) {
      const hasMeasurable = measurablePatterns.some((p) => p.test(line));
      if (!hasMeasurable) {
        findings.push({
          severity: "medium",
          category: "acceptance-criteria",
          location: `acceptance-criteria:${i + 1}`,
          summary: `Acceptance criterion uses vague qualifier without measurable threshold: "${line.trim().slice(0, 60)}..."`,
          recommendation: "Add a measurable threshold (e.g., 'in under 2 seconds', 'for 95% of users').",
        });
      }
    }
  }

  // Count acceptance criteria and flag if zero
  if (matches.length === 0 && content.includes("Acceptance")) {
    findings.push({
      severity: "high",
      category: "acceptance-criteria",
      location: "user-stories",
      summary: "No formal Given/When/Then acceptance criteria found",
      recommendation: "Add structured acceptance criteria (Given/When/Then format) for each user story.",
    });
  }

  return findings;
}

function checkUserStories(content: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const storyPattern = /^###\s+User\s+Story\s+\d+\s*[-–—]\s*(.+)$/i;
  const matches = content.match(storyPattern) || [];

  for (const match of matches) {
    const storyTitle = match.replace(storyPattern, "$1").trim();
    // Check if title follows subject/verb/benefit structure
    // Simple heuristic: has at least 2 words and not too long
    const words = storyTitle.split(/\s+/);

    if (words.length < 2) {
      findings.push({
        severity: "medium",
        category: "user-story",
        location: `user-story:${match}`,
        summary: `User story title too short or unclear: "${storyTitle}"`,
        recommendation: "Use a subject/verb/benefit structure (e.g., 'User can upload files securely').",
      });
    }
  }

  // Check for missing independent test section
  if (matches.length > 0 && !content.match(/\*\*Independent Test\*\*/i)) {
    findings.push({
      severity: "high",
      category: "user-story",
      location: "user-stories",
      summary: "User stories found but Independent Test section appears missing",
      recommendation: "Add **Independent Test** description for each user story.",
    });
  }

  // Check for missing "Why this priority" in user stories
  const whyPriorityMissing = countMissingField(content, "Why this priority");
  if (whyPriorityMissing > 0) {
    findings.push({
      severity: "medium",
      category: "user-story",
      location: "user-stories",
      summary: `${whyPriorityMissing} user story(ies) missing "Why this priority" explanation`,
      recommendation: "Add a 'Why this priority' explanation to each user story.",
    });
  }

  return findings;
}

function checkRequirements(content: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const reqPattern = /^\*\*([A-Z]+-\d+)\*\*:\s*(.+)/gm;
  const matches = [...content.matchAll(reqPattern)];

  const measurablePatterns = [
    /must\s+\w+\s+in\s+under\s+\d+/i,
    /must\s+handle\s+\d+/i,
    /%\s+of/i,
    /under\s+\d+\s+second/i,
    /greater\s+than\s+\d+/i,
  ];

  const vaguePatterns = [
    /fast/i,
    /quick/i,
    /efficient/i,
    /robust/i,
    /secure/i,
    /intuitive/i,
    /scalable/i,
  ];

  for (const match of matches) {
    const reqId = match[1];
    const reqText = match[2];

    // Check for vague requirements
    const hasVague = vaguePatterns.some((p) => p.test(reqText));
    const hasMeasurable = measurablePatterns.some((p) => p.test(reqText));

    if (hasVague && !hasMeasurable) {
      findings.push({
        severity: "high",
        category: "requirements",
        location: `req:${reqId}`,
        summary: `Requirement ${reqId} uses vague qualifier without measurable criteria: "${reqText.slice(0, 50)}..."`,
        recommendation: "Add measurable criteria (e.g., 'must respond in under 200ms').",
      });
    }

    // Check for missing MUST/SHOULD/NICE
    if (!/\bMUST\b|\bSHOULD\b|\bMAY\b|\bNICE\b/i.test(reqText)) {
      findings.push({
        severity: "low",
        category: "requirements",
        location: `req:${reqId}`,
        summary: `Requirement ${reqId} lacks RFC 2119 keyword (MUST/SHOULD/MAY/NICE)`,
        recommendation: "Add a normative keyword (MUST, SHOULD, or MAY) to the requirement.",
      });
    }
  }

  return findings;
}

function checkPlaceholders(content: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const placeholderPatterns = [
    /\[NEEDS CLARIFICATION:[^\]]+\]/gi,
    /\[ACTION REQUIRED\]/gi,
    /\[TODO\]/gi,
    /\[TKTK\]/gi,
    /\?\?\?/g,
    /<placeholder>/gi,
  ];

  let totalPlaceholders = 0;

  for (const pattern of placeholderPatterns) {
    const matches = content.match(pattern) || [];
    totalPlaceholders += matches.length;
  }

  if (totalPlaceholders > 0) {
    findings.push({
      severity: "high",
      category: "clarity",
      location: "spec",
      summary: `${totalPlaceholders} unresolved placeholder(s) found in spec`,
      recommendation: "Resolve all [NEEDS CLARIFICATION] markers and fill in placeholder content before proceeding.",
    });
  }

  return findings;
}

function countMissingField(content: string, fieldName: string): number {
  const storyPattern = /^###\s+User\s+Story\s+\d+/gim;
  const storyMatches = content.match(storyPattern) || [];
  let count = 0;

  // Split content by user story headers
  const parts = content.split(storyPattern);

  // parts[0] is content before first user story, parts[1+] are between headers
  // We need to check each story block (parts[i] for i >= 1)
  for (let i = 1; i < parts.length; i++) {
    const storyContent = parts[i];
    // Check if this story block contains the field
    if (!storyContent.includes(fieldName)) {
      count++;
    }
  }

  return count;
}

function countUserStories(content: string): number {
  const storyPattern = /^###\s+User\s+Story\s+\d+/gim;
  const matches = content.match(storyPattern) || [];
  return matches.length;
}

function countRequirements(content: string): number {
  const reqPattern = /^\*\*[A-Z]+-\d+\*\*/gm;
  const matches = content.match(reqPattern) || [];
  return matches.length;
}

function countAcceptanceCriteria(content: string): number {
  const pattern = /Given\s+.+\s+When\s+.+\s+Then\s+.+/gi;
  const matches = content.match(pattern) || [];
  return matches.length;
}

function calculateScore(findings: QualityFinding[]): number {
  if (findings.length === 0) return 100;

  let deductions = 0;

  for (const finding of findings) {
    switch (finding.severity) {
      case "critical":
        deductions += 25;
        break;
      case "high":
        deductions += 15;
        break;
      case "medium":
        deductions += 8;
        break;
      case "low":
        deductions += 3;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

export { reviewSpecQuality };
export type { QualityFinding, SpecReviewResult };
