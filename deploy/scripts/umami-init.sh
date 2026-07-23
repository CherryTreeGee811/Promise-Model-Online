#!/bin/sh
set -e

ADMIN_USER="${UMAMI_ADMIN_USERNAME:-pmo_admin}"
ADMIN_PASS=$(cat /run/secrets/umami_admin_password)
DB_PASSWORD=$(cat /run/secrets/umami_db_password)

psql() {
  PGPASSWORD=$DB_PASSWORD command psql -h umami-db -U umami -d umami -tAc "$1"
}

echo "[umami-init] Waiting for Umami migrations..."
until psql "SELECT to_regclass('\"user\"') IS NOT NULL;" | grep -q t; do sleep 2; done
echo "[umami-init] Database ready."

HASH=$(htpasswd -nbB "$ADMIN_USER" "$ADMIN_PASS" | cut -d: -f2 | sed "s/\\\$2y\\$/\\\$2b\\$/")

EXISTS=$(psql "SELECT COUNT(*) FROM \"user\" WHERE username = '$ADMIN_USER';")

if [ "$EXISTS" = "0" ]; then
  echo "[umami-init] Creating admin user..."
  psql "INSERT INTO \"user\" (user_id, username, password, role, created_at) VALUES (gen_random_uuid(), '$ADMIN_USER', '$HASH', 'admin', NOW());"
  echo "[umami-init] Admin created."
else
  echo "[umami-init] Admin exists, updating password..."
  psql "UPDATE \"user\" SET password = '$HASH' WHERE username = '$ADMIN_USER';"
  echo "[umami-init] Password synced."
fi

ADMIN_ID=$(psql "SELECT user_id FROM \"user\" WHERE username = '$ADMIN_USER';")
if [ -z "$ADMIN_ID" ]; then
  echo "[umami-init] ERROR: Could not resolve admin user_id."
  exit 1
fi
echo "[umami-init] Admin user_id: $ADMIN_ID"

ALREADY=$(psql "SELECT COUNT(*) FROM website WHERE website_id = '$WEBSITE_ID';")
if [ "$ALREADY" = "0" ]; then
  psql "INSERT INTO website (website_id, name, domain, user_id, created_at) VALUES ('$WEBSITE_ID', '$WEBSITE_NAME', '$WEBSITE_DOMAIN', '$ADMIN_ID', NOW());"
  echo "[umami-init] Website created."
else
  echo "[umami-init] Website already exists."
fi

echo "[umami-init] Setup complete."
