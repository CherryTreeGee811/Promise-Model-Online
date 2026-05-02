Quick verification

Run the helper script to restore and build locally:

```bash
./scripts/verify_local_build.sh
```

To inspect seeded projects after containers are up:

```bash
# from repository root (adjust container name/password)
docker exec -i promisemodelonline-db /opt/mssql-tools/bin/sqlcmd -S localhost -U pmo_api -P 'YourPmoApiPassword' -d PromiseModelOnline -i scripts/check_projects.sql
```

If you hit OpenAPI compilation errors, run:

```bash
dotnet nuget locals all --clear
dotnet clean Promise-Model-Online.sln -c Debug
dotnet restore Promise-Model-Online.sln
dotnet build Promise-Model-Online.sln -c Debug
```

If you want me to run checks inside the repo, provide an environment with `dotnet` available.
