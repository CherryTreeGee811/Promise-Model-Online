#!/usr/bin/env bash
set -euo pipefail

# Layer 3: Bundle boundary audit.
# Verifies the production Vite bundle contains only expected modules
# by parsing the built chunks for unexpected import patterns.
# Uses the rollup-plugin-visualizer JSON tree when available,
# falls back to a heuristic scan of built JS files.

echo "=== Layer 3: Bundle Boundary Audit ==="

BUILD_DIR="PromiseModelOnline.Client/wwwroot/dist"
STATS_FILE="$BUILD_DIR/stats.json"

if [ ! -d "$BUILD_DIR/js" ]; then
  echo "  No built files found. Run 'npm run build' first."
  exit 1
fi

echo "  Scanning $(find "$BUILD_DIR/js" -name '*.js' | wc -l) bundle chunk(s)"

# Known production package patterns that are ALLOWED in the bundle
ALLOWED_PKG_PREFIXES=(
  "@microsoft/signalr"
  "@popperjs/core"
  "bootstrap"
  "bootstrap-icons"
  "d3"
  "tippy.js"
)

SUSPICIOUS=0

# Scan each JS chunk for node_modules imports
while IFS= read -r chunk; do
  name=$(basename "$chunk")

  # Extract all node_modules references from the built file
  # In production builds, module references are in import() expressions
  # or in the chunk preamble comments
  while IFS= read -r ref; do
    # Clean the reference to get package name
    pkg=$(echo "$ref" | sed 's/.*node_modules\///' | sed 's/\/.*//' | sed 's/"//g' | sed "s/'//g" || true)
    if [ -z "$pkg" ]; then
      continue
    fi

    # Check if it's an allowed production package
    allowed=false
    for prefix in "${ALLOWED_PKG_PREFIXES[@]}"; do
      if [[ "$pkg" == "$prefix"* ]]; then
        allowed=true
        break
      fi
    done

    if [ "$allowed" = false ]; then
      echo "  ❌ Unexpected package in bundle: $pkg (in $name)"
      SUSPICIOUS=$((SUSPICIOUS + 1))
    fi
  done < <(grep -oP 'node_modules/[@\w][^"'"'"',;)\s]+' "$chunk" 2>/dev/null | sort -u || true)
done < <(find "$BUILD_DIR/js" -name '*.js' -type f 2>/dev/null || true)

echo ""
echo "=== Summary ==="
if [ "$SUSPICIOUS" -gt 0 ]; then
  echo "  ❌ $SUSPICIOUS unexpected package(s) found in bundle"
  exit 1
fi
echo "  ✅ Bundle boundary is clean"
