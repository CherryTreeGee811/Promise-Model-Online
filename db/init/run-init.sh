#!/bin/sh
set -eu

SA_PASSWORD=${DB_SA_PASSWORD:-SADevelopment10*}
API_USER=${PMO_API_DB_USER:-pmo_api}
API_PASSWORD=${PMO_API_DB_PASSWORD:-ChangeMeApi123!}
AUTH_USER=${PMO_AUTH_DB_USER:-pmo_auth}
AUTH_PASSWORD=${PMO_AUTH_DB_PASSWORD:-ChangeMeAuth123!}
SQLCMD=/opt/mssql-tools/bin/sqlcmd

sql_escape_literal() {
  printf "%s" "$1" | sed "s/'/''/g"
}

API_PASSWORD_SQL=$(sql_escape_literal "$API_PASSWORD")
AUTH_PASSWORD_SQL=$(sql_escape_literal "$AUTH_PASSWORD")

until "$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; do
  echo 'Waiting for SQL Server...'
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

IF EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'sa' AND is_disabled = 0)
BEGIN
  ALTER LOGIN [sa] DISABLE;
END
GO
EOF

"$SQLCMD" -S promisemodelonline.db,1433 -U sa -P "$SA_PASSWORD" -i /tmp/create-app-accounts.generated.sql

echo 'Database application accounts created or already present.'
