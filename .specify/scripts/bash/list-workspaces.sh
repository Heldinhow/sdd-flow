#!/usr/bin/env bash

# List all workspaces in specs/ with their state, phase, and last modified time
#
# Usage: ./list-workspaces.sh [--json]
#   --json    Output results in JSON format

set -e

JSON_MODE=false

for arg in "$@"; do
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --help|-h)
            echo "Usage: $0 [--json]"
            echo "  --json    Output results in JSON format"
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option '$arg'. Use --help for usage." >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REPO_ROOT="$(get_repo_root)"
SPECS_DIR="$REPO_ROOT/specs"

if [[ ! -d "$SPECS_DIR" ]]; then
    if $JSON_MODE; then
        echo '{"workspaces":[]}'
    else
        echo "No specs/ directory found. Run /sdd to create your first workspace."
    fi
    exit 0
fi

# Detect current branch
CURRENT_BRANCH="$(get_current_branch 2>/dev/null || echo '')"

# Function to detect phase of a workspace
detect_phase() {
    local ws_dir="$1"
    local phase="unknown"

    if [[ -f "$ws_dir/tasks.md" ]]; then
        phase="tasks"
    elif [[ -f "$ws_dir/plan.md" ]]; then
        phase="plan"
    elif [[ -f "$ws_dir/spec.md" ]]; then
        phase="spec"
    elif [[ -d "$ws_dir" ]]; then
        phase="initialized"
    fi

    echo "$phase"
}

# Function to get last modified time
get_mtime() {
    local dir="$1"
    local mtime=0

    if stat -f %m "$dir" >/dev/null 2>&1; then
        mtime="$(stat -f %m "$dir")"
    elif stat -c %Y "$dir" >/dev/null 2>&1; then
        mtime="$(stat -c %Y "$dir")"
    fi

    echo "$mtime"
}

# Collect workspace data
declare -a workspaces_json=()

for dir in "$SPECS_DIR"/*; do
    [[ -d "$dir" ]] || continue

    local name
    name="$(basename "$dir")"

    # Only include feature branches
    if ! is_feature_branch "$name"; then
        continue
    fi

    local phase
    phase="$(detect_phase "$dir")"

    local mtime
    mtime="$(get_mtime "$dir")"

    local is_active="false"
    if [[ "$name" == "$CURRENT_BRANCH" ]]; then
        is_active="true"
    fi

    local has_uncommitted="false"
    if [[ -d "$dir" ]] && git rev-parse --git-dir >/dev/null 2>&1; then
        if git status --porcelain "$dir" 2>/dev/null | grep -q .; then
            has_uncommitted="true"
        fi
    fi

    local spec_file="$dir/spec.md"
    local plan_file="$dir/plan.md"
    local tasks_file="$dir/tasks.md"

    local spec_exists="false"
    local plan_exists="false"
    local tasks_exists="false"

    [[ -f "$spec_file" ]] && spec_exists="true"
    [[ -f "$plan_file" ]] && plan_exists="true"
    [[ -f "$tasks_file" ]] && tasks_exists="true"

    if $JSON_MODE; then
        local entry
        entry=$(jq -n \
            --arg name "$name" \
            --arg phase "$phase" \
            --argjson mtime "$mtime" \
            --argjson is_active "$is_active" \
            --argjson has_uncommitted "$has_uncommitted" \
            --argjson spec_exists "$spec_exists" \
            --argjson plan_exists "$plan_exists" \
            --argjson tasks_exists "$tasks_exists" \
            '{name:$name,phase:$phase,mtime:$mtime,is_active:$is_active,has_uncommitted:$has_uncommitted,artifacts:{spec:$spec_exists,plan:$plan_exists,tasks:$tasks_exists}}')
        workspaces_json+=("$entry")
    else
        local active_marker=""
        [[ "$is_active" == "true" ]] && active_marker=" (active)"
        local uncommitted_marker=""
        [[ "$has_uncommitted" == "true" ]] && uncommitted_marker=" *"

        echo "$name$active_marker$uncommitted_marker"
        echo "  Phase: $phase"
        if [[ -n "$CURRENT_BRANCH" ]]; then
            echo "  Branch: $name"
        fi
        echo "  Artifacts: spec=$spec_exists plan=$plan_exists tasks=$tasks_exists"
        echo ""
    fi
done

if $JSON_MODE; then
    if [[ ${#workspaces_json[@]} -eq 0 ]]; then
        echo '{"workspaces":[]}'
    else
        local json_array
        json_array=$(printf '%s\n' "${workspaces_json[@]}" | jq -s .)
        jq -n \
            --argjson workspaces "$json_array" \
            '{workspaces:$workspaces}'
    fi
fi
