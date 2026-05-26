using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;


namespace PromiseModelOnline.Api.Extensions
{
    public static class MigrationExtensions
    {
        public static void ApplyMigrations(this IApplicationBuilder app)
        {
            using IServiceScope scope = app.ApplicationServices.CreateScope();

            using PromiseModelOnlineContext dbContext =
                scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();

            dbContext.Database.Migrate();
        }
    }
}