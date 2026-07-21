#!/bin/bash
cd /home/JacobSeed/Desktop/Promise-Model-Online/deploy

export APP_BASE_URL=https://drew-dealt-wishes-identified.trycloudflare.com
export AUTH_PUBLIC_ISSUER=https://drew-dealt-wishes-identified.trycloudflare.com
export AUTH_INTERNAL_AUTHORITY=https://promisemodelonline-auth:8060
export AUTH_METADATA_ADDRESS=https://promisemodelonline-auth:8060/.well-known/openid-configuration
export AUTH_GOOGLE_CLIENT_ID=340495856258-heqovn699jubqhgumf61a52fkrnv9a3v.apps.googleusercontent.com
export DATA_PROTECTION_KEYS_PATH=/app/dp-keys
export ASPNETCORE_ENVIRONMENT=Production
export API_DB_USER=pmo_api
export AUTH_DB_USER=pmo_auth
export PMO_API_DB_USER=pmo_api
export PMO_AUTH_DB_USER=pmo_auth
export UMAMI_ADMIN_USERNAME=pmo_admin
export UMAMI_WEBSITE_ID=813ea5c6-8576-44d0-b702-923f5ba331cd
export UMAMI_WEBSITE_NAME="Promise Model Online"
export UMAMI_WEBSITE_DOMAIN=localhost
UMAMI_DB_PASSWORD=$(cat secrets/umami_db_password.txt 2>/dev/null || echo "iLko7DtHt0WIdBh2f_SPRMVhbH1asuX-")
export UMAMI_DB_PASSWORD="$UMAMI_DB_PASSWORD"

DOCKER_HOST=unix:///home/JacobSeed/.docker/desktop/docker.sock docker stack rm promisemodelonline 2>&1 | tail -3
sleep 10
for i in 1 2 3; do
  RESULT=$(DOCKER_HOST=unix:///home/JacobSeed/.docker/desktop/docker.sock docker stack deploy -c docker-stack.yml promisemodelonline 2>&1)
  echo "$RESULT"
  if ! echo "$RESULT" | grep -q "network.*not found"; then
    break
  fi
  echo "Network not ready, retrying in 10s..."
  sleep 10
done
