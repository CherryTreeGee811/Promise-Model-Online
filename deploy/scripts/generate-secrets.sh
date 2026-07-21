#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p secrets keys/client keys/auth keys/bff keys/proxy

# ============================================================
# AUTO-GENERATED secrets  (safe to regenerate — random values)
# Only created if they don't already exist.
# ============================================================
gen() {
  if [ -f "secrets/$1" ]; then
    echo "  secrets/$1  [EXISTS — kept]"
  else
    openssl rand -base64 48 | tr -d '\n' > "secrets/$1"
    echo "  secrets/$1  [generated]"
  fi
}

echo "=== Auto-generated secrets ==="
gen auth_db_password.txt
gen api_db_password.txt
gen umami_db_password.txt
gen umami_admin_password.txt
gen cert_password.txt
gen auth_registration_key.txt

# MSSQL SA password (special complexity requirements)
if [ -f secrets/db_sa_password.txt ]; then
  echo "  secrets/db_sa_password.txt  [EXISTS — kept]"
else
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
  echo "  secrets/db_sa_password.txt  [generated]"
fi

# ============================================================
# EXTERNAL secrets  (cannot be auto-generated)
# Create placeholder if missing, then warn the user.
# ============================================================
echo ""
echo "=== External secrets (YOU must provide these) ==="
created=0
for f in google_client_secret.txt sendgrid_api_key.txt cloudflare_tunnel_token.txt github_token.txt; do
  if [ -s "secrets/$f" ] && ! grep -q "REPLACE_ME\|PLACEHOLDER" "secrets/$f" 2>/dev/null; then
    echo "  secrets/$f  [OK]"
  else
    echo "REPLACE_ME_$(openssl rand -hex 16)" > "secrets/$f"
    echo "  secrets/$f  [PLACEHOLDER — replace with real value]"
    created=1
  fi
done

if [ "$created" -eq 1 ]; then
  echo ""
  echo "⚠️  WARNING: One or more external secrets have placeholder values."
  echo "   The stack will deploy but these services will fail until you provide real values:"
  echo "     • secrets/google_client_secret.txt      — Google OAuth (Cloud Console)"
  echo "     • secrets/sendgrid_api_key.txt          — SendGrid email API key"
  echo "     • secrets/cloudflare_tunnel_token.txt   — Cloudflare Zero Trust tunnel"
  echo "     • secrets/github_token.txt              — GitHub PAT (scope: issues:write)"
  echo ""
  echo "   Edit each file and replace the placeholder with your real secret."
fi

# ============================================================
# Self-signed TLS certificates
# ============================================================
echo ""
echo "=== TLS certificates ==="
if [ -f keys/client/cert.pem ] && openssl x509 -in keys/client/cert.pem -noout -checkend 86400 >/dev/null 2>&1; then
  echo "  keys/client/  [valid]"
else
  openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout keys/client/key.pem -out keys/client/cert.pem \
    -days 365 -subj "/CN=promisemodel.online/O=Promise Model Online/C=CA" 2>/dev/null
  echo "  keys/client/  [generated]"
fi

for dir in auth bff proxy; do
  if [ -f "keys/$dir/cert.pem" ] && openssl x509 -in "keys/$dir/cert.pem" -noout -checkend 86400 >/dev/null 2>&1; then
    echo "  keys/$dir/  [valid]"
  else
    case $dir in
      auth)  subj="/CN=promisemodelonline.auth/O=Promise Model Online Auth/C=CA" ;;
      bff)   subj="/CN=promisemodelonline.bff/O=Promise Model Online BFF/C=CA" ;;
      proxy) subj="/CN=promisemodelonline.proxy/O=Promise Model Online Proxy/C=CA" ;;
    esac
    openssl req -x509 -newkey rsa:4096 -nodes \
      -keyout "keys/$dir/key.pem" -out "keys/$dir/cert.pem" \
      -days 365 -subj "$subj" 2>/dev/null
    echo "  keys/$dir/  [generated]"
  fi
done

# Auth PFX (always regenerated — depends on keypair, not a durable secret)
CERT_PASS=$(cat secrets/cert_password.txt)
if [ -f keys/auth/cert.pfx ] && [ -f keys/auth/cert.pem ]; then
  openssl pkcs12 -export \
    -in keys/auth/cert.pem -inkey keys/auth/key.pem \
    -out keys/auth/cert.pfx \
    -passout "pass:$CERT_PASS" \
    -name "Promise Model Online Token Signing" 2>/dev/null
  echo "  keys/auth/cert.pfx  [regenerated]"
fi

chmod 600 secrets/*.txt 2>/dev/null || true
chmod 644 keys/*/*.pem keys/*/*.pfx 2>/dev/null || true

echo ""
echo "Done. All secrets and keys in deploy/"
