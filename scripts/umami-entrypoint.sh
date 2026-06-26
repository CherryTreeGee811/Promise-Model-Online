#!/bin/sh
set -euo pipefail

UMAMI_PASS=$(cat /run/secrets/umami_db_password)
export DATABASE_URL="postgresql://umami:${UMAMI_PASS}@umami-db:5432/umami"

exec "$@"
