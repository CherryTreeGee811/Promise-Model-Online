using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Abstractions;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class AuthorizationSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();

            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var scopeManager = scope.ServiceProvider.GetRequiredService<IOpenIddictScopeManager>();

            await SeedUsersAsync(userManager);
            await SeedScopesAsync(scopeManager);
        }

        private static async Task SeedUsersAsync(UserManager<IdentityUser> userManager)
        {
            var users = new[]
            {
                new { UserName = "pmo_test", Email = "pmo@gmail.com" },
                new { UserName = "pmo_test2", Email = "pmo2@gmail.com" }
            };

            foreach (var u in users)
            {
                if (await userManager.FindByNameAsync(u.UserName) == null)
                {
                    var newUser = new IdentityUser
                    {
                        UserName = u.UserName,
                        Email = u.Email,
                        EmailConfirmed = true
                    };

                    await userManager.CreateAsync(newUser, "Hello123*");
                }
            }
        }

        private static async Task SeedScopesAsync(IOpenIddictScopeManager scopeManager)
        {
            if (await scopeManager.FindByNameAsync("projects.read") == null)
            {
                await scopeManager.CreateAsync(new OpenIddictScopeDescriptor
                {
                    Name = "projects.read",
                    DisplayName = "Read projects"
                });
            }

            if (await scopeManager.FindByNameAsync("projects.write") == null)
            {
                await scopeManager.CreateAsync(new OpenIddictScopeDescriptor
                {
                    Name = "projects.write",
                    DisplayName = "Write projects"
                });
            }
        }
    }
}