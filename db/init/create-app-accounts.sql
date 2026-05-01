SET NOCOUNT ON;
GO

DECLARE @ApiLogin sysname = N'$(ApiLogin)';
DECLARE @ApiPassword nvarchar(128) = N'$(ApiPassword)';
DECLARE @AuthLogin sysname = N'$(AuthLogin)';
DECLARE @AuthPassword nvarchar(128) = N'$(AuthPassword)';

IF DB_ID(N'PromiseModelOnline') IS NULL
BEGIN
    CREATE DATABASE [PromiseModelOnline];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'$(ApiLogin)')
BEGIN
    EXEC (N'CREATE LOGIN [' + REPLACE(@ApiLogin, N']', N']]') + N'] WITH PASSWORD = ''' + REPLACE(@ApiPassword, N'''', N'''''') + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;');
END
GO

USE [PromiseModelOnline];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$(ApiLogin)')
BEGIN
    EXEC (N'CREATE USER [' + REPLACE(@ApiLogin, N']', N']]') + N'] FOR LOGIN [' + REPLACE(@ApiLogin, N']', N']]') + N'];');
END
GO

EXEC (N'ALTER LOGIN [' + REPLACE(@ApiLogin, N']', N']]') + N'] WITH DEFAULT_DATABASE = [PromiseModelOnline];');
GO

IF IS_ROLEMEMBER(N'db_owner', N'$(ApiLogin)') <> 1
BEGIN
    EXEC sp_addrolemember N'db_owner', N'$(ApiLogin)';
END
GO

IF DB_ID(N'PromiseModelOnlineAuth') IS NULL
BEGIN
    CREATE DATABASE [PromiseModelOnlineAuth];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'$(AuthLogin)')
BEGIN
    EXEC (N'CREATE LOGIN [' + REPLACE(@AuthLogin, N']', N']]') + N'] WITH PASSWORD = ''' + REPLACE(@AuthPassword, N'''', N'''''') + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;');
END
GO

USE [PromiseModelOnlineAuth];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$(AuthLogin)')
BEGIN
    EXEC (N'CREATE USER [' + REPLACE(@AuthLogin, N']', N']]') + N'] FOR LOGIN [' + REPLACE(@AuthLogin, N']', N']]') + N'];');
END
GO

EXEC (N'ALTER LOGIN [' + REPLACE(@AuthLogin, N']', N']]') + N'] WITH DEFAULT_DATABASE = [PromiseModelOnlineAuth];');
GO

IF IS_ROLEMEMBER(N'db_owner', N'$(AuthLogin)') <> 1
BEGIN
    EXEC sp_addrolemember N'db_owner', N'$(AuthLogin)';
END
GO

IF EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'sa' AND is_disabled = 0)
BEGIN
    ALTER LOGIN [sa] DISABLE;
END
GO
