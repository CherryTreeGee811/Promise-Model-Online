#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

gen() { openssl rand -base64 48 | tr -d '\n' > "secrets/$1"; echo "  secrets/$1"; }

echo "Generating secrets (384-bit, openssl)..."
gen auth_db_password.txt
gen api_db_password.txt
gen umami_db_password.txt
gen umami_admin_password.txt
gen cert_password.txt
gen auth_registration_key.txt

# MSSQL SA password with complexity requirements
python3 -c "
import secrets, string
c = string.ascii_uppercase + string.ascii_lowercase + string.digits
p = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(4))
p += ''.join(secrets.choice(string.ascii_lowercase) for _ in range(4))
p += ''.join(secrets.choice(string.digits) for _ in range(4))
p += ''.join(secrets.choice('!@#%^&*-_=+') for _ in range(3))
p += ''.join(secrets.choice(c) for _ in range(15))
print(''.join(secrets.SystemRandom().sample(p, len(p)))[:30])
" > secrets/db_sa_password.txt
echo "  secrets/db_sa_password.txt"

# External API placeholders (replace with real values)
for f in google_client_secret.txt sendgrid_api_key.txt cloudflare_tunnel_token.txt; do
  [ -s "secrets/$f" ] || { echo "REPLACE_ME_$(openssl rand -hex 16)" > "secrets/$f"; echo "  secrets/$f  [PLACEHOLDER]"; }
done

echo ""
echo "Generating RSA 4096 self-signed certs..."
for dir in client auth bff proxy; do mkdir -p "keys/$dir"; done
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout keys/client/key.pem -out keys/client/cert.pem \
  -days 365 -subj "/CN=promisemodel.online/O=Promise Model Online/C=CA" 2>/dev/null
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout keys/auth/key.pem -out keys/auth/cert.pem \
  -days 365 -subj "/CN=promisemodelonline.auth/O=Promise Model Online Auth/C=CA" 2>/dev/null
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout keys/bff/key.pem -out keys/bff/cert.pem \
  -days 365 -subj "/CN=promisemodelonline.bff/O=Promise Model Online BFF/C=CA" 2>/dev/null
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout keys/proxy/key.pem -out keys/proxy/cert.pem \
  -days 365 -subj "/CN=promisemodelonline.proxy/O=Promise Model Online Proxy/C=CA" 2>/dev/null
CERT_PASS=$(cat secrets/cert_password.txt)
openssl pkcs12 -export \
  -in keys/auth/cert.pem -inkey keys/auth/key.pem \
  -out keys/auth/cert.pfx \
  -passout "pass:$CERT_PASS" \
  -name "Promise Model Online Token Signing" 2>/dev/null
chmod 600 secrets/*.txt 2>/dev/null || true
chmod 644 keys/*/*.pem keys/*/*.pfx 2>/dev/null || true
echo "Done. All secrets and keys in deploy/"
echo "Replace secrets/google_client_secret.txt, secrets/sendgrid_api_key.txt, secrets/cloudflare_tunnel_token.txt with real values."
