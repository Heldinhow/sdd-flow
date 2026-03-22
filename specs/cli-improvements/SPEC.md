# CLI Improvements - SDD Specification

## Overview
Improve the SDD CLI to be more robust, user-friendly, and provide better error messages.

## User Stories

### US-1: Init Command
As a **developer**, I want to **initialize a new SDD project** so that **I can start using SDD workflow quickly**.

**Acceptance Criteria:**
- Given I run `sdd init` in an empty directory
- When the command completes
- Then a `.specify/` directory is created with proper structure
- And `sdd init --bootstrap` works correctly

### US-2: Workspace Command
As a **developer**, I want to **manage multiple workspaces** so that **I can work on multiple projects efficiently**.

**Acceptance Criteria:**
- Given I have multiple workspaces
- When I run `sdd workspaces list`
- Then all workspaces are displayed with their paths and status
- And errors are reported clearly

### US-3: Script Resolution
As a **developer**, I want to **discover scripts automatically** so that **I don't have to configure paths manually**.

**Acceptance Criteria:**
- Given scripts in repo and bundle locations
- When I request a script
- Then the correct path is returned or clear error if missing
- And no non-existent paths are returned

## Requirements

### MUST
- [ ] Fix `--bootstrap` flag handling in init
- [ ] Fix dead fallback code in cmdWorkspaces
- [ ] Fix getScriptPath to return null/undefined when missing

### SHOULD
- [ ] Add better error messages with suggestions
- [ ] Add `--verbose` mode for debugging

### NICE
- [ ] Add shell completion
- [ ] Add config file support
