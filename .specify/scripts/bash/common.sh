#!/usr/bin/env bash
# Common functions and variables for all scripts

BRANCH_PREFIX_PATTERN="${SPECIFY_BRANCH_PREFIX_PATTERN:-feat|fix|refactor|init|test}"

find_project_root() {
    local dir="$1"

    while [[ "$dir" != "/" ]]; do
        if [[ -d "$dir/.specify" ]]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done

    return 1
}

get_script_repo_root() {
    local script_dir
    script_dir="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    (cd "$script_dir/../../.." && pwd)
}

get_repo_root() {
    if [[ -n "${SPECIFY_REPO_ROOT:-}" ]] && [[ -d "${SPECIFY_REPO_ROOT}/.specify" ]]; then
        echo "$SPECIFY_REPO_ROOT"
        return
    fi

    local script_root
    script_root="$(get_script_repo_root)"
    if [[ -d "$script_root/.specify" ]]; then
        echo "$script_root"
        return
    fi

    local discovered_root=""
    if discovered_root="$(find_project_root "$PWD" 2>/dev/null)"; then
        echo "$discovered_root"
        return
    fi

    local git_root=""
    if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
        if discovered_root="$(find_project_root "$git_root" 2>/dev/null)"; then
            echo "$discovered_root"
            return
        fi
        echo "$git_root"
        return
    fi

    echo "$script_root"
}

is_legacy_feature_branch() {
    local branch="$1"
    [[ "$branch" =~ ^[0-9]{3}- ]]
}

is_typed_feature_branch() {
    local branch="$1"
    [[ "$branch" =~ ^(${BRANCH_PREFIX_PATTERN})-[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]
}

is_feature_branch() {
    local branch="$1"
    [[ "$branch" =~ ^[0-9]{3}- ]] || [[ "$branch" =~ ^(${BRANCH_PREFIX_PATTERN})-[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]
}

get_latest_feature_dir_name() {
    local specs_dir="$1"
    local latest_feature=""
    local latest_mtime=0

    [[ -d "$specs_dir" ]] || return 1

    for dir in "$specs_dir"/*; do
        [[ -d "$dir" ]] || continue

        local dirname
        dirname="$(basename "$dir")"
        if ! is_feature_branch "$dirname"; then
            continue
        fi

        local mtime=0
        if stat -f %m "$dir" >/dev/null 2>&1; then
            mtime="$(stat -f %m "$dir")"
        elif stat -c %Y "$dir" >/dev/null 2>&1; then
            mtime="$(stat -c %Y "$dir")"
        fi

        if [[ "$mtime" -ge "$latest_mtime" ]]; then
            latest_mtime="$mtime"
            latest_feature="$dirname"
        fi
    done

    [[ -n "$latest_feature" ]] && echo "$latest_feature"
}

get_current_branch() {
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi

    local git_branch=""
    if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
        git_branch="$(git rev-parse --abbrev-ref HEAD)"
        if is_feature_branch "$git_branch"; then
            echo "$git_branch"
            return
        fi
    fi

    local repo_root
    repo_root="$(get_repo_root)"
    local specs_dir="$repo_root/specs"
    local latest_feature=""
    latest_feature="$(get_latest_feature_dir_name "$specs_dir" 2>/dev/null || true)"
    if [[ -n "$latest_feature" ]]; then
        echo "$latest_feature"
        return
    fi

    if [[ -n "$git_branch" ]]; then
        echo "$git_branch"
        return
    fi

    echo "main"
}

has_git() {
    local git_root=""
    git_root="$(git rev-parse --show-toplevel 2>/dev/null)" || return 1
    [[ "$git_root" == "$(get_repo_root)" ]]
}

check_feature_branch() {
    local branch="$1"
    local has_git_repo="$2"

    if [[ "$has_git_repo" != "true" ]]; then
        echo "[specify] Warning: Git repository not detected; skipped branch validation" >&2
        return 0
    fi

    if ! is_feature_branch "$branch"; then
        echo "ERROR: Not on a feature branch. Current branch: $branch" >&2
        echo "Feature branches should be named like: feat-short-name or 001-feature-name" >&2
        return 1
    fi

    return 0
}

get_feature_dir() { echo "$1/specs/$2"; }

resolve_feature_dir() {
    local repo_root="$1"
    local branch_name="$2"
    local specs_dir="$repo_root/specs"

    if [[ -d "$specs_dir/$branch_name" ]]; then
        echo "$specs_dir/$branch_name"
        return
    fi

    if [[ ! "$branch_name" =~ ^([0-9]{3})- ]]; then
        echo "$specs_dir/$branch_name"
        return
    fi

    local prefix="${BASH_REMATCH[1]}"
    local matches=()
    if [[ -d "$specs_dir" ]]; then
        for dir in "$specs_dir"/"$prefix"-*; do
            [[ -d "$dir" ]] || continue
            matches+=("$(basename "$dir")")
        done
    fi

    if [[ ${#matches[@]} -eq 0 ]]; then
        echo "$specs_dir/$branch_name"
    elif [[ ${#matches[@]} -eq 1 ]]; then
        echo "$specs_dir/${matches[0]}"
    else
        echo "ERROR: Multiple spec directories found with prefix '$prefix': ${matches[*]}" >&2
        echo "Please ensure only one spec directory exists per legacy numeric prefix." >&2
        return 1
    fi
}

get_feature_paths() {
    local repo_root
    repo_root="$(get_repo_root)"
    local current_branch
    current_branch="$(get_current_branch)"
    local has_git_repo="false"

    if has_git; then
        has_git_repo="true"
    fi

    local feature_dir
    if ! feature_dir="$(resolve_feature_dir "$repo_root" "$current_branch")"; then
        echo "ERROR: Failed to resolve feature directory" >&2
        return 1
    fi

    printf 'REPO_ROOT=%q\n' "$repo_root"
    printf 'CURRENT_BRANCH=%q\n' "$current_branch"
    printf 'HAS_GIT=%q\n' "$has_git_repo"
    printf 'FEATURE_DIR=%q\n' "$feature_dir"
    printf 'FEATURE_SPEC=%q\n' "$feature_dir/spec.md"
    printf 'IMPL_PLAN=%q\n' "$feature_dir/plan.md"
    printf 'TASKS=%q\n' "$feature_dir/tasks.md"
    printf 'RESEARCH=%q\n' "$feature_dir/research.md"
    printf 'DATA_MODEL=%q\n' "$feature_dir/data-model.md"
    printf 'QUICKSTART=%q\n' "$feature_dir/quickstart.md"
    printf 'CONTRACTS_DIR=%q\n' "$feature_dir/contracts"
}

has_jq() {
    command -v jq >/dev/null 2>&1
}

json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\t'/\\t}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\b'/\\b}"
    s="${s//$'\f'/\\f}"
    local LC_ALL=C
    local i char code
    for (( i=0; i<${#s}; i++ )); do
        char="${s:$i:1}"
        printf -v code '%d' "'$char" 2>/dev/null || code=256
        if (( code >= 1 && code <= 31 )); then
            printf '\\u%04x' "$code"
        else
            printf '%s' "$char"
        fi
    done
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }

resolve_template() {
    local template_name="$1"
    local repo_root="$2"
    local explicit_path="$repo_root/.specify/templates/${template_name}.md"

    if [[ -f "$explicit_path" ]]; then
        echo "$explicit_path"
        return 0
    fi

    return 1
}
