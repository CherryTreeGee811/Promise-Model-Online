#!/usr/bin/env bash
set -eu

RESULTS_DIR="${1:?Usage: $0 <results-dir> <line-threshold> [branch-threshold] [method-threshold]}"
LINE_THRESHOLD="${2:?}"
BRANCH_THRESHOLD="${3:-}"
METHOD_THRESHOLD="${4:-}"

exit_code=0

for f in "$RESULTS_DIR"/*/coverage.cobertura.xml; do
  [ -f "$f" ] || continue

  lr=$(grep -oP 'line-rate="\K[0-9.]+' "$f" | head -1)
  br=$(grep -oP 'branch-rate="\K[0-9.]+' "$f" | head -1)

  name=$(basename "$(dirname "$f")")
  summary="[$name]"
  ok=true

  summary+=" line=$lr"
  awk "BEGIN{exit($lr < $LINE_THRESHOLD)}" || { ok=false; summary+="(<${LINE_THRESHOLD})"; }

  if [ -n "$BRANCH_THRESHOLD" ]; then
    summary+=" branch=$br"
    awk "BEGIN{exit($br < $BRANCH_THRESHOLD)}" || { ok=false; summary+="(<${BRANCH_THRESHOLD})"; }
  fi

  if [ -n "$METHOD_THRESHOLD" ]; then
    total=$(grep -cP '<method ' "$f" || true)
    covered=$(grep -oP '<method .*line-rate="\K[0-9.]+' "$f" | awk '$1 > 0' | wc -l || true)
    mr=$(awk "BEGIN{printf \"%.4f\", $covered / ($total ? $total : 1)}")
    summary+=" method=$mr"
    awk "BEGIN{exit($mr < $METHOD_THRESHOLD)}" || { ok=false; summary+="(<${METHOD_THRESHOLD})"; }
  fi

  echo "  $summary"

  if ! $ok; then
    exit_code=1
  fi
done

exit $exit_code
