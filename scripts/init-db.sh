#!/bin/sh

SENTINEL="/var/opt/mssql/.db-initialized"
if [ -f "$SENTINEL" ]; then
    echo "[db-init] Database already initialized (sentinel found). Skipping."
    exit 0
fi

read_secret_file() {
    if [ ! -f "$1" ]; then
        echo "FATAL: Secret file $1 not found. Mount a Docker secret at this path." >&2
        exit 1
    fi
    if [ ! -s "$1" ]; then
        echo "FATAL: Secret file $1 is empty. Populate it with a password." >&2
        exit 1
    fi
    cat "$1"
}

SA_PASSWORD=$(read_secret_file /run/secrets/db_sa_password)
API_PASSWORD=$(read_secret_file /run/secrets/api_db_password)
AUTH_PASSWORD=$(read_secret_file /run/secrets/auth_db_password)
SQLCMD=/opt/mssql-tools/bin/sqlcmd

sql_escape_literal() {
  printf "%s" "$1" | sed "s/'/''/g"
}

API_PASSWORD_SQL=$(sql_escape_literal "$API_PASSWORD")
AUTH_PASSWORD_SQL=$(sql_escape_literal "$AUTH_PASSWORD")

MAX_RETRIES=36 RETRY=0
until "$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; do
  # Check if failure is due to SA being disabled
  if "$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -Q "SELECT 1" 2>&1 | grep -qi "account is disabled"; then
    echo "SA account disabled. Assuming already initialized."
    exit 0
  fi
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "FATAL: SQL Server did not become available within 180 seconds."
    exit 1
  fi
  echo "Waiting for SQL Server... (attempt $RETRY/$MAX_RETRIES)"
  sleep 5
done

cat >/tmp/create-app-accounts.generated.sql <<EOF
SET NOCOUNT ON;
GO

IF DB_ID(N'PromiseModelOnline') IS NULL
BEGIN
  CREATE DATABASE [PromiseModelOnline];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'pmo_api')
BEGIN
  CREATE LOGIN [pmo_api] WITH PASSWORD = N'$API_PASSWORD_SQL', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
END
GO

USE [PromiseModelOnline];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'pmo_api')
BEGIN
  CREATE USER [pmo_api] FOR LOGIN [pmo_api];
END
GO

ALTER LOGIN [pmo_api] WITH DEFAULT_DATABASE = [PromiseModelOnline];
GO

IF IS_ROLEMEMBER(N'db_owner', N'pmo_api') <> 1
BEGIN
  EXEC sp_addrolemember N'db_owner', N'pmo_api';
END
GO

IF DB_ID(N'PromiseModelOnlineAuth') IS NULL
BEGIN
  CREATE DATABASE [PromiseModelOnlineAuth];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'pmo_auth')
BEGIN
  CREATE LOGIN [pmo_auth] WITH PASSWORD = N'$AUTH_PASSWORD_SQL', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
END
GO

USE [PromiseModelOnlineAuth];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'pmo_auth')
BEGIN
  CREATE USER [pmo_auth] FOR LOGIN [pmo_auth];
END
GO

ALTER LOGIN [pmo_auth] WITH DEFAULT_DATABASE = [PromiseModelOnlineAuth];
GO

IF IS_ROLEMEMBER(N'db_owner', N'pmo_auth') <> 1
BEGIN
  EXEC sp_addrolemember N'db_owner', N'pmo_auth';
END
GO
EOF

"$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -i /tmp/create-app-accounts.generated.sql

# Explicitly verify initialization
echo "Verifying database initialization..."
"$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -Q "
IF DB_ID(N'PromiseModelOnline') IS NULL OR DB_ID(N'PromiseModelOnlineAuth') IS NULL
BEGIN
  RAISERROR('Database initialization failed.', 16, 1);
END
"
if [ $? -ne 0 ]; then
  echo "ERROR: Database verification failed." >&2
  exit 1
fi

# Disable SA after verification
"$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -Q "ALTER LOGIN sa DISABLE;"

echo 'Database application accounts created, SA disabled, and initialization verified.'

touch "$SENTINEL"
echo "[db-init] Sentinel file created at $SENTINEL"