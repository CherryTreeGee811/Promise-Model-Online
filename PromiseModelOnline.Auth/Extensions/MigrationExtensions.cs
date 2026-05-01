using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Auth.DAL;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class MigrationExtensions
    {
        public static void ApplyMigrations(this IApplicationBuilder app)
        {
            using IServiceScope scope = app.ApplicationServices.CreateScope();

            using AuthorizationDbContext dbContext =
                scope.ServiceProvider.GetRequiredService<AuthorizationDbContext>();

            dbContext.Database.Migrate();
        }
    }
}