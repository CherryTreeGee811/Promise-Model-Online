using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class AuthorizationSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            await SeedUsersAsync(userManager);
        }

        private static async Task SeedUsersAsync(UserManager<IdentityUser> userManager)
        {
            var soTestUser = await userManager.FindByNameAsync("pmo_test");
            if (soTestUser == null)
            {
                var newTestUser = new IdentityUser
                {
                    UserName = "pmo_test",
                    Email = "pmo@gmail.com",
                    NormalizedUserName = "PMO_TEST",
                    NormalizedEmail = "PMO@GMAIL.COM",
                    EmailConfirmed = true,
                };

                await userManager.CreateAsync(newTestUser, "Hello123*");
            }
        }
    }
}