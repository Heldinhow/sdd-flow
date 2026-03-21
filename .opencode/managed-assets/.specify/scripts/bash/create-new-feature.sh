#!/usr/bin/env bash

set -e

JSON_MODE=false
SHORT_NAME=""
BRANCH_TYPE="feat"
LEGACY_NUMBER=""
ARGS=()

i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --short-name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            SHORT_NAME="${!i}"
            ;;
        --type)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --type requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            BRANCH_TYPE="${!i}"
            ;;
        --number)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            LEGACY_NUMBER="${!i}"
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--short-name <name>] [--type <prefix>] [--number N] <feature_description>"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --short-name <name> Provide a custom short name (2-4 words) for the branch"
            echo "  --type <prefix>     Branch type prefix: feat|fix|refactor|init|test"
            echo "  --number N          Legacy numeric feature number (compatibility mode)"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
    i=$((i + 1))
done

FEATURE_DESCRIPTION="${ARGS[*]}"
FEATURE_DESCRIPTION="$(printf '%s' "$FEATURE_DESCRIPTION" | xargs)"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Error: Feature description cannot be empty" >&2
    exit 1
fi

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

clean_branch_name() {
    local name="$1"
    printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

generate_branch_name() {
    local description="$1"
    local stop_words="^(i|a|an|the|to|for|of|in|on|at|by|with|from|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall|this|that|these|those|my|your|our|their|want|need|add|get|set)$"
    local clean_name
    clean_name=$(printf '%s' "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')

    local meaningful_words=()
    for word in $clean_name; do
        [ -z "$word" ] && continue
        if ! printf '%s' "$word" | grep -qiE "$stop_words"; then
            if [ ${#word} -ge 3 ]; then
                meaningful_words+=("$word")
            fi
        fi
    done

    if [ ${#meaningful_words[@]} -gt 0 ]; then
        local max_words=3
        if [ ${#meaningful_words[@]} -eq 4 ]; then
            max_words=4
        fi

        local result=""
        local count=0
        for word in "${meaningful_words[@]}"; do
            if [ $count -ge $max_words ]; then
                break
            fi
            if [ -n "$result" ]; then
                result="$result-"
            fi
            result="$result$word"
            count=$((count + 1))
        done
        printf '%s\n' "$result"
        return
    fi

    clean_branch_name "$description"
}

normalize_branch_type() {
    local branch_type
    branch_type="$(clean_branch_name "$1")"
    if [[ ! "$branch_type" =~ ^(${BRANCH_PREFIX_PATTERN})$ ]]; then
        echo "Error: Unsupported branch type '$1'. Use one of: feat, fix, refactor, init, test" >&2
        exit 1
    fi
    printf '%s\n' "$branch_type"
}

REPO_ROOT="$(get_repo_root)"
cd "$REPO_ROOT"
SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

HAS_GIT=false
if has_git; then
    HAS_GIT=true
fi

if [ -n "$SHORT_NAME" ]; then
    BRANCH_SUFFIX="$(clean_branch_name "$SHORT_NAME")"
else
    BRANCH_SUFFIX="$(generate_branch_name "$FEATURE_DESCRIPTION")"
fi

if [ -z "$BRANCH_SUFFIX" ]; then
    echo "Error: Failed to derive a short branch name from the feature description" >&2
    exit 1
fi

FEATURE_NUM=""
BRANCH_PREFIX=""
if [ -n "$LEGACY_NUMBER" ]; then
    FEATURE_NUM=$(printf "%03d" "$((10#$LEGACY_NUMBER))")
    BRANCH_NAME="${FEATURE_NUM}-${BRANCH_SUFFIX}"
else
    BRANCH_PREFIX="$(normalize_branch_type "$BRANCH_TYPE")"
    BRANCH_NAME="${BRANCH_PREFIX}-${BRANCH_SUFFIX}"
fi

MAX_BRANCH_LENGTH=244
if [ ${#BRANCH_NAME} -gt $MAX_BRANCH_LENGTH ]; then
    local_prefix_length=${#BRANCH_NAME}
    if [ -n "$FEATURE_NUM" ]; then
        local_prefix_length=4
    else
        local_prefix_length=$((${#BRANCH_PREFIX} + 1))
    fi
    max_suffix_length=$((MAX_BRANCH_LENGTH - local_prefix_length))
    truncated_suffix=$(printf '%s' "$BRANCH_SUFFIX" | cut -c1-"$max_suffix_length" | sed 's/-$//')
    if [ -n "$FEATURE_NUM" ]; then
        BRANCH_NAME="${FEATURE_NUM}-${truncated_suffix}"
    else
        BRANCH_NAME="${BRANCH_PREFIX}-${truncated_suffix}"
    fi
fi

if [ "$HAS_GIT" = true ]; then
    if ! git checkout -b "$BRANCH_NAME" 2>/dev/null; then
        if git branch --list "$BRANCH_NAME" | grep -q .; then
            echo "Error: Branch '$BRANCH_NAME' already exists." >&2
        else
            echo "Error: Failed to create git branch '$BRANCH_NAME'." >&2
        fi
        exit 1
    fi
else
    echo "[specify] Warning: Git repository not detected; skipped branch creation for $BRANCH_NAME" >&2
fi

FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE=$(resolve_template "spec-template" "$REPO_ROOT") || true
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -n "$TEMPLATE" ] && [ -f "$TEMPLATE" ]; then
    cp "$TEMPLATE" "$SPEC_FILE"
else
    echo "Warning: Spec template not found; created empty spec file" >&2
    touch "$SPEC_FILE"
fi

printf '# To persist: export SPECIFY_FEATURE=%q\n' "$BRANCH_NAME" >&2

if $JSON_MODE; then
    if command -v jq >/dev/null 2>&1; then
        jq -cn \
            --arg branch_name "$BRANCH_NAME" \
            --arg spec_file "$SPEC_FILE" \
            --arg branch_prefix "$BRANCH_PREFIX" \
            --arg feature_num "$FEATURE_NUM" \
            '{BRANCH_NAME:$branch_name,SPEC_FILE:$spec_file,BRANCH_PREFIX:$branch_prefix,FEATURE_NUM:$feature_num}'
    else
        printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","BRANCH_PREFIX":"%s","FEATURE_NUM":"%s"}\n' \
            "$(json_escape "$BRANCH_NAME")" \
            "$(json_escape "$SPEC_FILE")" \
            "$(json_escape "$BRANCH_PREFIX")" \
            "$(json_escape "$FEATURE_NUM")"
    fi
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    if [ -n "$BRANCH_PREFIX" ]; then
        echo "BRANCH_PREFIX: $BRANCH_PREFIX"
    fi
    if [ -n "$FEATURE_NUM" ]; then
        echo "FEATURE_NUM: $FEATURE_NUM"
    fi
    printf '# To persist in your shell: export SPECIFY_FEATURE=%q\n' "$BRANCH_NAME"
fi
