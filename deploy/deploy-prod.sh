#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# === Production Environment ===
export APP_BASE_URL=https://promisemodel.online
export AUTH_PUBLIC_ISSUER=https://promisemodel.online
export AUTH_INTERNAL_AUTHORITY=https://promisemodelonline-auth:8060
export AUTH_METADATA_ADDRESS=https://promisemodelonline-auth:8060/.well-known/openid-configuration

export ASPNETCORE_ENVIRONMENT=Production
export API_DB_USER=pmo_api
export AUTH_DB_USER=pmo_auth
export PMO_API_DB_USER=pmo_api
export PMO_AUTH_DB_USER=pmo_auth
export DATA_PROTECTION_KEYS_PATH=/app/dp-keys

# Umami
export UMAMI_ADMIN_USERNAME=pmo_admin
export UMAMI_WEBSITE_ID=813ea5c6-8576-44d0-b702-923f5ba331cd
export UMAMI_WEBSITE_NAME="Promise Model Online"
export UMAMI_WEBSITE_DOMAIN=promisemodel.online
export UMAMI_DB_PASSWORD=$(cat secrets/umami_db_password.txt 2>/dev/null || echo "change-me")

echo "=== Generating certificates ==="
bash scripts/generate-certs.sh

echo "=== Initializing Docker Swarm (if not already) ==="
docker swarm init 2>/dev/null || true

echo "=== Creating Docker Swarm secrets ==="
for secret in db_sa_password api_db_password auth_db_password google_client_secret \
              sendgrid_api_key cert_password umami_db_password umami_admin_password \
              cloudflare_tunnel_token auth_registration_key; do
  if [ -f "secrets/$secret.txt" ]; then
    docker secret inspect "pmo_$secret" > /dev/null 2>&1 && \
      echo "  pmo_$secret already exists" || \
      docker secret create "pmo_$secret" "secrets/$secret.txt"
  else
    echo "  WARNING: secrets/$secret.txt not found — create it before deploying"
  fi
done

echo "=== Deploying Swarm stack ==="
docker stack deploy -c docker-stack.yml promisemodelonline

echo ""
echo "=== Monitoring services ==="
echo "Run 'docker service ls --filter name=promisemodelonline' to check status"
echo "Run 'docker stack ps promisemodelonline' for task details"
echo ""
echo "Application should be available at https://localhost:9000"
echo "Cloudflare tunnel will connect to promisemodel.online automatically"
