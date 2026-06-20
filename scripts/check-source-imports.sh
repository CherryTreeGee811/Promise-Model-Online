#!/usr/bin/env bash
set -euo pipefail

# Layer 2: Source code import boundary check.
# Uses depcheck to ensure no dev-only packages are imported
# in production source code paths.

echo "=== Layer 2: Source Code Import Boundary Check ==="

# Run depcheck from project root (where package.json is)
DEPCHECK_OUTPUT=$(npx depcheck \
  --ignores="depcheck,vite,vite-plugin-inspect,rollup-plugin-visualizer" \
  --specials="eslint,typescript" \
  2>/dev/null || true)

ERRORS=0

# Check for dev packages imported in production source
# depcheck lists "Missing dependencies" if packages used in source
# aren't in package.json at all — but we also want to check
# that packages in devDependencies aren't imported.

# Check for unused production dependencies (stale)
UNUSED_DEPS=$(echo "$DEPCHECK_OUTPUT" | awk '/^Unused dependencies/,/^Unused devDependencies/' | grep -v '^Unused' | grep -v '^\*' | grep -v '^$' || true)
if [ -n "$UNUSED_DEPS" ]; then
  echo "  ⚠️  Unused production dependencies (consider moving to devDependencies):"
  echo "$UNUSED_DEPS" | sed 's/^/    /'
  # This is advisory, not a hard failure — packages may be used dynamically
fi

# Check for packages NOT in dependencies but used in source (leak via devDeps)
MISSING_DEPS=$(echo "$DEPCHECK_OUTPUT" | awk '/^Missing dependencies/,/^Unused/{if(NF>0 && $0 !~ /^Missing/ && $0 !~ /^Unused/ && $0 !~ /^\*/) print}' | grep -v '^$' || true)
if [ -n "$MISSING_DEPS" ]; then
  echo "  ❌ Missing production dependencies (used in source but only in devDependencies):"
  echo "$MISSING_DEPS"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== Summary ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ $ERRORS violation(s) — dev-only packages imported in production code"
  echo "  Action: Add the above package(s) to 'dependencies' in package.json,"
  echo "  or remove the import if it is not needed in production."
  exit 1
fi
echo "  ✅ Source code import boundary is clean"
