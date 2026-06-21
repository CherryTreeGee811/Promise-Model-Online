using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Auth.DAL;

namespace PromiseModelOnline.Auth.Extensions;

/// <summary>Extension for applying EF Core migrations at application startup.</summary>
public static class MigrationExtensions
{
    /// <summary>Apply any pending EF Core migrations to the database.</summary>
    /// <param name="app">The application builder for creating the service scope.</param>
    public static void ApplyMigrations(this IApplicationBuilder app)
    {
        using IServiceScope scope = app.ApplicationServices.CreateScope();
        using AuthorizationDbContext dbContext =
            scope.ServiceProvider.GetRequiredService<AuthorizationDbContext>();

        dbContext.Database.Migrate();
    }
}
