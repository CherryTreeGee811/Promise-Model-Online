#!/bin/sh
set -e

if [ -f /run/secrets/db_sa_password ]; then
  SA_PASSWORD=$(cat /run/secrets/db_sa_password)
  if [ -z "$SA_PASSWORD" ]; then
    echo "FATAL: db_sa_password secret is empty." >&2
    exit 1
  fi
  export MSSQL_SA_PASSWORD="$SA_PASSWORD"
fi

exec /opt/mssql/bin/launch_sqlservr.sh "$@"