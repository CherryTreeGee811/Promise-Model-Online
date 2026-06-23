#!/usr/bin/env bash
set -euo pipefail

# Layer 4: Docker image node_modules validation.
# Verifies that the production Docker image contains ONLY the expected
# production dependencies in its node_modules directory.
#
# This is designed to run against the built Docker image as part of
# the release pipeline, not during standard CI.

echo "=== Layer 4: Docker Image Dependency Validation ==="

if [ -z "${1:-}" ]; then
  echo "  Usage: $0 <docker_image_tag>"
  echo "  Example: $0 promisemodelonlineclient:latest"
  echo ""
  echo "  Run this after 'docker build' in the release pipeline."
  echo "  Skipping — no image tag provided."
  exit 0
fi

IMAGE="$1"
TMPDIR=$(mktemp -d)

echo "  Checking image: $IMAGE"

# Run a Node.js script inside the Docker container to verify dependencies
docker run --rm "$IMAGE" node -e '
const fs = require("fs");
const path = require("path");

// Expected production packages (from package.json dependencies)
const EXPECTED = new Set([
  "@microsoft/signalr",
  "@popperjs/core",
  "bootstrap",
  "bootstrap-icons",
  "d3",
  "tippy.js"
]);

const nodeModules = "/app/wwwroot/node_modules";
if (!fs.existsSync(nodeModules)) {
  // Check standard path
  const altPath = "/app/node_modules";
  if (fs.existsSync(altPath)) {
    nodeModules = altPath;
  }
  console.log("No node_modules found (app may be statically built)");
  process.exit(0);
}

const installed = fs.readdirSync(nodeModules).filter(d => d[0] !== ".");

const violations = [];
for (const pkg of installed) {
  if (!EXPECTED.has(pkg) && !pkg.startsWith("@")) {
    violations.push(pkg);
  }
  // For @scoped packages, check the inner scope directory
  if (pkg.startsWith("@")) {
    const scoped = fs.readdirSync(path.join(nodeModules, pkg));
    for (const inner of scoped) {
      const fullPkg = pkg + "/" + inner;
      if (!EXPECTED.has(fullPkg)) {
        violations.push(fullPkg);
      }
    }
  }
}

if (violations.length > 0) {
  console.log("❌ Unexpected packages in node_modules:");
  violations.forEach(v => console.log("   " + v));
  process.exit(1);
}
console.log("✅ All packages in node_modules are expected production dependencies");
' 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "  ❌ Docker image dependency validation FAILED"
  exit 1
fi

echo ""
echo "  ✅ Docker image dependency boundary is clean"
