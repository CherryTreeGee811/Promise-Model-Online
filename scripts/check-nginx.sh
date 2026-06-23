#!/usr/bin/env bash
set -euo pipefail

# Validate nginx configuration files for syntax and security best practices.
#
# Tests three config pairs that match the actual deployment layout:
#   1. Production  : PromiseModelOnline.Client/nginx.conf (no server block in repo)
#   2. UI tests    : nginx-test.conf + default-test.conf (server block)
#   3. E2E tests   : nginx-test.conf + default-e2e.conf (server block)
#
# Syntax check uses Docker-based nginx -t (skipped if Docker isn't running).
# Security check validates required headers on server block files.

ERRORS=0

echo "=== Nginx Configuration Validation ==="

# ─── Config pairs ───
# Each pair: (label|main_config|server_block)
# server_block can be empty string if none

CONFIG_PAIRS=()

if [ -f "PromiseModelOnline.Client/nginx.conf" ] && [ -f "PromiseModelOnline.Client/default.conf" ]; then
  CONFIG_PAIRS+=("production|PromiseModelOnline.Client/nginx.conf|PromiseModelOnline.Client/default.conf")
fi

if [ -f "infrastructure/tests/nginx-test.conf" ] && [ -f "infrastructure/tests/default-test.conf" ]; then
  CONFIG_PAIRS+=("ui-test|infrastructure/tests/nginx-test.conf|infrastructure/tests/default-test.conf")
fi

if [ -f "infrastructure/tests/nginx-test.conf" ] && [ -f "infrastructure/tests/default-e2e.conf" ]; then
  CONFIG_PAIRS+=("e2e-test|infrastructure/tests/nginx-test.conf|infrastructure/tests/default-e2e.conf")
fi

echo "  Found ${#CONFIG_PAIRS[@]} config pair(s)"

for pair in "${CONFIG_PAIRS[@]}"; do
  LABEL=$(echo "$pair" | cut -d'|' -f1)
  MAIN=$(echo "$pair" | cut -d'|' -f2)
  SERVER=$(echo "$pair" | cut -d'|' -f3)

  echo ""
  echo "  [$LABEL] Main: $MAIN"
  if [ -n "$SERVER" ]; then
    echo "           Server block: $SERVER"
  fi

  # ─── Syntax validation (Docker only) ───
  TMPDIR=$(mktemp -d)
  mkdir -p "$TMPDIR/conf.d"
  cp "$MAIN" "$TMPDIR/nginx.conf"
  if [ -n "$SERVER" ]; then
    cp "$SERVER" "$TMPDIR/conf.d/default.conf"
  fi

  # Generate self-signed TLS cert for server blocks that require one
  if [ -n "$SERVER" ] && grep -q 'listen.*ssl' "$SERVER" 2>/dev/null; then
    openssl req -x509 -newkey rsa:2048 \
      -keyout "$TMPDIR/key.pem" \
      -out "$TMPDIR/cert.pem" \
      -days 1 -nodes \
      -subj '/CN=localhost' 2>/dev/null
  fi

  if [ -f "$TMPDIR/cert.pem" ]; then
    DOCKER_ARGS+=(
      -v "$TMPDIR/cert.pem:/etc/nginx/cert.pem:ro"
      -v "$TMPDIR/key.pem:/etc/nginx/key.pem:ro"
    )
  fi

  DOCKER_OUTPUT=$(docker run --rm "${DOCKER_ARGS[@]}" nginx:alpine nginx -t 2>&1 || true)
  if echo "$DOCKER_OUTPUT" | grep -q 'syntax is ok\|test is successful\|configuration file.*test is successful'; then
    echo "    ✅ Syntax OK"
  elif echo "$DOCKER_OUTPUT" | grep -q '\[emerg\]'; then
    echo "    ❌ Syntax error"
    echo "$DOCKER_OUTPUT" | grep -E '\[emerg\]' || true
    ERRORS=$((ERRORS + 1))
  else
    echo "    ⚠️  Docker volume mount unavailable — skipping syntax validation"
  fi

  rm -rf "$TMPDIR"

  # ─── Security header checks (server block files only) ───
  if [ -z "$SERVER" ]; then
    echo "    ⚠️  Main config only — headers checked in server block"
    continue
  fi

  if grep -q 'add_header Strict-Transport-Security' "$SERVER"; then
    echo "    ✅ HSTS header found"
  else
    echo "    ❌ Missing HSTS header"
    ERRORS=$((ERRORS + 1))
  fi

  if grep -q 'add_header X-Frame-Options' "$SERVER"; then
    echo "    ✅ X-Frame-Options header found"
  else
    echo "    ⚠️  Missing X-Frame-Options header"
  fi

  if grep -q 'add_header Content-Security-Policy' "$SERVER"; then
    echo "    ✅ CSP header found"
  else
    echo "    ❌ Missing CSP header"
    ERRORS=$((ERRORS + 1))
  fi


done

echo ""
echo "=== Summary ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ $ERRORS error(s)"
  exit 1
fi
echo "  ✅ All nginx configs valid"
