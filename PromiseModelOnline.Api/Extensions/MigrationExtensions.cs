using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;

namespace PromiseModelOnline.Api.Extensions;

/// <summary>Extension for applying EF Core migrations at application startup.</summary>
/// <remarks>
///   Resolves the <see cref="PromiseModelOnlineContext"/> from the DI scope and runs pending
///   migrations synchronously during application startup. Call from <c>Program.cs</c>:
///   <c>app.ApplyMigrations()</c>.
/// </remarks>
public static class MigrationExtensions
{
    /// <summary>Apply any pending EF Core migrations to the database.</summary>
    /// <param name="app">The application builder for accessing the service scope.</param>
    public static void ApplyMigrations(this IApplicationBuilder app)
    {
        using IServiceScope scope = app.ApplicationServices.CreateScope();

        using PromiseModelOnlineContext dbContext =
            scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();

        dbContext.Database.Migrate();
    }
}
