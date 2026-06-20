#!/usr/bin/env bash
set -euo pipefail

# Validate nginx configuration files for syntax and security best practices.
#
# Syntax check uses Docker-based nginx -t.
# Security check validates required headers and TLS settings.

ERRORS=0

echo "=== Nginx Configuration Validation ==="

# Find all nginx config files
NGINX_FILES=()

# Production config
if [ -f "PromiseModelOnline.Client/nginx.conf" ]; then
  NGINX_FILES+=("PromiseModelOnline.Client/nginx.conf")
fi

# Infrastructure test configs
for f in infrastructure/tests/default-test.conf infrastructure/tests/default-e2e.conf infrastructure/tests/nginx-test.conf; do
  if [ -f "$f" ]; then
    NGINX_FILES+=("$f")
  fi
done

echo "  Found ${#NGINX_FILES[@]} nginx config(s)"

for config in "${NGINX_FILES[@]}"; do
  echo ""
  echo "  Checking: $config"

  # === Syntax validation ===
  if command -v docker &>/dev/null; then
    # Create a temp directory with the config so nginx -t can resolve includes
    TMPDIR=$(mktemp -d)
    CONFD="$TMPDIR/conf.d"
    mkdir -p "$CONFD"

    cp "$config" "$TMPDIR/nginx.conf"

    # Copy conf.d files alongside
    if [ -d "$(dirname "$config")/conf.d" ]; then
      cp "$(dirname "$config")/conf.d/"* "$CONFD/" 2>/dev/null || true
    fi

    if docker run --rm -v "$TMPDIR:/etc/nginx:ro" nginx:alpine nginx -t -c /etc/nginx/nginx.conf 2>/dev/null; then
      echo "    ✅ Syntax OK"
    else
      echo "    ❌ Syntax error"
      docker run --rm -v "$TMPDIR:/etc/nginx:ro" nginx:alpine nginx -t -c /etc/nginx/nginx.conf 2>&1 || true
      ERRORS=$((ERRORS + 1))
    fi

    rm -rf "$TMPDIR"
  else
    echo "    ⚠️  Docker not available — skipping syntax check"
  fi

  # === Security header checks (for server blocks) ===
  if grep -q 'add_header Strict-Transport-Security' "$config" 2>/dev/null; then
    echo "    ✅ HSTS header found"
  else
    echo "    ❌ Missing HSTS header (Strict-Transport-Security)"
    ERRORS=$((ERRORS + 1))
  fi

  if grep -q 'add_header X-Frame-Options' "$config" 2>/dev/null; then
    echo "    ✅ X-Frame-Options header found"
  else
    echo "    ⚠️  Missing X-Frame-Options header (not required for API-only blocks)"
  fi

  if grep -q 'add_header Content-Security-Policy' "$config" 2>/dev/null; then
    echo "    ✅ CSP header found"
  else
    echo "    ⚠️  Missing Content-Security-Policy (verify parent config or upstream sets it)"
  fi

  if grep -q 'ssl_protocols\|ssl_ciphers' "$config" 2>/dev/null; then
    echo "    ✅ TLS settings found"
  else
    echo "    ⚠️  No explicit TLS settings — verify deployment handles this"
  fi
done

echo ""
echo "=== Summary ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ $ERRORS error(s)"
  exit 1
fi
echo "  ✅ All nginx configs valid"
