#!/usr/bin/env bash

# Load and parse tasks.md for the /implement command
# Usage: ./load-tasks.sh <tasks-path> [feature-dir]
#
# Outputs JSON with task structure:
#   - featureDir: The workspace directory
#   - tasks: Array of task objects (id, description, phase, userStory, parallel, completed, filePaths)
#   - phases: List of unique phases
#   - totalTasks: Total task count
#   - completedTasks: Number of completed tasks

set -e

TASKS_PATH="${1:-}"
FEATURE_DIR="${2:-}"

if [[ -z "$TASKS_PATH" ]]; then
    echo '{"error":"Usage: load-tasks.sh <tasks-path> [feature-dir]"}' >&2
    exit 1
fi

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

BUN_PATH="${REPO_ROOT}/.opencode/node_modules/.bin/bun"
if [[ ! -x "$BUN_PATH" ]]; then
    BUN_PATH="$(which bun 2>/dev/null || echo '')"
fi

if [[ -z "$BUN_PATH" ]] || [[ ! -x "$BUN_PATH" ]]; then
    echo "{\"error\":\"bun not found\"}" >&2
    exit 1
fi

SCRIPT_PATH="${REPO_ROOT}/.opencode/src/workflow/load-tasks.ts"

if [[ ! -f "$SCRIPT_PATH" ]]; then
    echo "{\"error\":\"load-tasks.ts not found at $SCRIPT_PATH\"}" >&2
    exit 1
fi

"$BUN_PATH" run "$SCRIPT_PATH" "$TASKS_PATH" "$FEATURE_DIR" 2>&1
