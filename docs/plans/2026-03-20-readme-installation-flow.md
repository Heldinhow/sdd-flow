# README Installation Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the project README so it clearly documents the recommended npm-plugin-plus-bootstrap installation model while honestly describing the currently working local clone workflow.

**Architecture:** Rewrite `README.md` around two explicit tracks: the target end-user installation flow and the current contributor/development flow. Keep the wording aligned with the actual OpenCode plugin loader behavior and the repository-managed SDD assets already present in this project.

**Tech Stack:** Markdown, OpenCode plugin loading conventions, repo-local `.opencode/` and `.specify/` workflow assets

---

### Task 1: Reframe README around user installation and repo bootstrap

**Files:**
- Modify: `README.md`

**Step 1: Replace the current short install section**

Add a top-level explanation that the preferred product direction is:

- install the plugin from npm in OpenCode
- open any repository in OpenCode
- select `Spec Driven`
- let the workflow bootstrap repo-local SDD assets when missing

**Step 2: Add a user quickstart section**

Document the intended user flow with numbered steps and a config snippet for `opencode.json`.

**Step 3: Add a repo bootstrap section**

List the managed assets installed into the repository and explain that `/sdd` is the repo-local backend while `Spec Driven` is the user-facing entrypoint.

**Step 4: Add a current-status note**

Be explicit that the npm distribution model is the recommended release shape, while the currently validated path is local project plugin loading from `.opencode/plugins/`.

**Step 5: Verify the README wording against actual behavior**

Check that all statements match the current repo structure and OpenCode plugin docs.
