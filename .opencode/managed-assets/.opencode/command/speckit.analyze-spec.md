---
description: Run automatic quality analysis on spec.md before planning — checks acceptance criteria measurability, user story structure, and missing sections.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Run automatic spec quality review before advancing to planning. This command analyzes `spec.md` for common quality issues and produces a structured report with findings and recommendations.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report only.

## Execution Steps

### 1. Initialize Analysis Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --include-spec` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS.

Derive: SPEC = FEATURE_DIR/spec.md

Abort with an error message if spec.md is missing.

### 2. Load spec.md

Read the full spec.md content from SPEC path.

### 3. Run Quality Analysis

The analysis checks for:

- **Missing required sections**: User Scenarios & Testing, Requirements, Success Criteria
- **Unmeasurable acceptance criteria**: criteria using vague qualifiers (fast, secure, intuitive) without measurable thresholds
- **Weak user stories**: titles missing subject/verb/benefit structure
- **Vague requirements**: functional requirements lacking RFC 2119 keywords (MUST/SHOULD/MAY)
- **Unresolved placeholders**: [NEEDS CLARIFICATION], [TODO], [TKTK], ???, <placeholder>

### 4. Produce Review Report

Output a markdown report:

## Spec Quality Review Report

**Score**: X/100

**Sections Found**: ...
**Sections Missing**: ...

**Findings:**

| # | Severity | Category | Location | Summary | Recommendation |
|---|----------|----------|---------|---------|----------------|
| 1 | HIGH | acceptance-criteria | spec.md | ... | ... |

**Summary:**
- User Stories reviewed: N
- Requirements reviewed: N
- Acceptance Criteria reviewed: N

**Next Actions:**
- [If score < 60]: Address critical issues before planning
- [If score >= 60]: Spec is ready for approval — run `/speckit.clarify` or approve via `/sdd`

## Context

$ARGUMENTS
