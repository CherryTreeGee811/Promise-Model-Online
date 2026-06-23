using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PromiseModelOnline.Auth.DAL;

namespace PromiseModelOnline.Auth;

/// <summary>Design-time factory for EF Core migrations (used by <c>dotnet ef</c> CLI).</summary>
/// <remarks>
///   Reads the <c>ConnectionStrings__MSSQL</c> environment variable to build the context.
///   Used only during development for migration generation.
/// </remarks>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AuthorizationDbContext>
{
    /// <summary>Create an <see cref="AuthorizationDbContext"/> using the MSSQL connection string from environment.</summary>
    /// <param name="args">The command line arguments.</param>
    /// <returns>The created <see cref="AuthorizationDbContext"/>.</returns>
    public AuthorizationDbContext CreateDbContext(string[] args)
    {
        var conn = Environment.GetEnvironmentVariable("ConnectionStrings__MSSQL");

        var builder = new DbContextOptionsBuilder<AuthorizationDbContext>();
        builder.UseSqlServer(conn);

        return new AuthorizationDbContext(builder.Options);
    }
}
