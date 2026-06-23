#!/usr/bin/env bash
set -euo pipefail

# Layer 1: Production dependency boundary check.
# Verifies package.json dependencies contain EXACTLY the expected set.
# FAILS if any dev dependency leaks into the production dependency tree,
# or if a new production dependency is added without updating the whitelist.

ERRORS=0

echo "=== Layer 1: Production Dependency Boundary Check ==="

EXPECTED=$(
  cat <<'PACKAGES'
@microsoft/signalr
@popperjs/core
bootstrap
bootstrap-icons
d3
tippy.js
PACKAGES
)

ACTUAL=$(npm ls --omit=dev --depth=0 --json 2>/dev/null \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
deps = data.get('dependencies', {})
# Filter out extraneous packages (postinstall artifacts not in package.json)
filtered = [k for k, v in deps.items() if not v.get('extraneous')]
filtered.sort()
for d in filtered:
    print(d)
")

if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "  ❌ Production dependency boundary violation"
  echo ""
  echo "  Expected:"
  echo "$EXPECTED" | sed 's/^/    /'
  echo ""
  echo "  Actual:"
  echo "$ACTUAL" | sed 's/^/    /'
  echo ""
  echo "  Diff (expected → actual):"
  diff --unified=0 <(echo "$EXPECTED") <(echo "$ACTUAL") || true
  echo ""
  echo "  ACTION REQUIRED:"
  echo "    - If a new production dependency was intentionally added,"
  echo "      add it to the EXPECTED list in scripts/check-prod-deps.sh"
  echo "    - If a dev tool was accidentally added to 'dependencies'"
  echo "      in package.json, move it to 'devDependencies'"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ Production dependency boundary is clean"
  echo "  ($(echo "$ACTUAL" | wc -l) package(s))"
fi

echo ""
echo "=== Summary ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ $ERRORS violation(s)"
  exit 1
fi
echo "  ✅ All layers pass"
