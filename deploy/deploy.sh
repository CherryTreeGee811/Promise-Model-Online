#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# === Production Environment Variables ===
# These must be exported before 'docker stack deploy' reads docker-stack.yml
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

export UMAMI_ADMIN_USERNAME=pmo_admin
export UMAMI_WEBSITE_ID=813ea5c6-8576-44d0-b702-923f5ba331cd
export UMAMI_WEBSITE_NAME="Promise Model Online"
export UMAMI_WEBSITE_DOMAIN=promisemodel.online
UMAMI_DB_PASSWORD=$(cat secrets/umami_db_password.txt 2>/dev/null || true)
export UMAMI_DB_PASSWORD="$UMAMI_DB_PASSWORD"

# === Certificate Generation ===
if [ ! -f keys/client/cert.pem ]; then
  echo "Generating certificates..."
  bash scripts/generate-secrets.sh
fi

# === Docker Swarm Initialization ===
docker swarm init 2>/dev/null || true

# === Docker Swarm Secrets ===
for secret in db_sa_password api_db_password auth_db_password google_client_secret \
              sendgrid_api_key cert_password umami_db_password umami_admin_password \
              cloudflare_tunnel_token auth_registration_key github_token; do
  if [ -f "secrets/$secret.txt" ]; then
    docker secret inspect "pmo_$secret" > /dev/null 2>&1 || \
      docker secret create "pmo_$secret" "secrets/$secret.txt"
  else
    echo "  WARNING: secrets/$secret.txt not found"
  fi
done

# === Stack Deploy ===
docker stack deploy -c docker-stack.yml promisemodelonline

echo ""
echo "Deploy initiated. Check status:"
echo "  docker service ls --filter name=promisemodelonline"
echo "  docker stack ps promisemodelonline"
