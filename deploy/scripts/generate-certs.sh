#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/.."
KEYS_DIR="$DEPLOY_DIR/keys"
CERT_PASSWORD="${CERT_PASSWORD:-$(cat "$DEPLOY_DIR/secrets/cert_password.txt" 2>/dev/null || echo "change-me-in-production")}"

mkdir -p "$KEYS_DIR/client" "$KEYS_DIR/auth" "$KEYS_DIR/bff" "$KEYS_DIR/proxy"

# Client cert (CN=promisemodel.online)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$KEYS_DIR/client/key.pem" \
  -out "$KEYS_DIR/client/cert.pem" \
  -days 365 -subj "/CN=promisemodel.online/O=Promise Model Online/C=CA"
chmod 644 "$KEYS_DIR/client/key.pem" "$KEYS_DIR/client/cert.pem"

# Same client certs used by the proxy
cp "$KEYS_DIR/client/cert.pem" "$KEYS_DIR/proxy/cert.pem"
cp "$KEYS_DIR/client/key.pem" "$KEYS_DIR/proxy/key.pem"

# Auth cert (CN=promisemodelonline.auth)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$KEYS_DIR/auth/key.pem" \
  -out "$KEYS_DIR/auth/cert.pem" \
  -days 365 -subj "/CN=promisemodelonline.auth/O=Promise Model Online Auth/C=CA"
chmod 644 "$KEYS_DIR/auth/key.pem" "$KEYS_DIR/auth/cert.pem"

# Auth PFX for token signing
openssl pkcs12 -export \
  -in "$KEYS_DIR/auth/cert.pem" \
  -inkey "$KEYS_DIR/auth/key.pem" \
  -out "$KEYS_DIR/auth/cert.pfx" \
  -passout pass:"$CERT_PASSWORD" \
  -name "Promise Model Online Token Signing"
chmod 644 "$KEYS_DIR/auth/cert.pfx"

# BFF cert (CN=promisemodelonline.bff)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$KEYS_DIR/bff/key.pem" \
  -out "$KEYS_DIR/bff/cert.pem" \
  -days 365 -subj "/CN=promisemodelonline.bff/O=Promise Model Online BFF/C=CA"
chmod 644 "$KEYS_DIR/bff/key.pem" "$KEYS_DIR/bff/cert.pem"

echo "Self-signed certificates generated in $KEYS_DIR"
