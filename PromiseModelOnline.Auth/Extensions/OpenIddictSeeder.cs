using OpenIddict.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using PromiseModelOnline.Auth.Common;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class OpenIddictSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var manager = services.GetRequiredService<IOpenIddictApplicationManager>();

            var existing = await manager.FindByClientIdAsync("pmo-spa");
            if (existing != null)
            {
                await manager.DeleteAsync(existing);
            }

            var descriptor = new OpenIddictApplicationDescriptor
            {
                ClientId = "pmo-spa",
                DisplayName = "PMO SPA",
                RedirectUris = { new Uri($"{AppUrls.BaseUrl}/auth/callback") },
                PostLogoutRedirectUris = { new Uri(AppUrls.BaseUrl) }
            };

            AddPermissions(descriptor);

            await manager.CreateAsync(descriptor);
        }

        private static void AddPermissions(OpenIddictApplicationDescriptor descriptor)
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Revocation);

            descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);

            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OpenId);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.Profile);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.Email);
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OfflineAccess);

            descriptor.Permissions.Add("scp:projects.read");
            descriptor.Permissions.Add("scp:projects.write");

            descriptor.Requirements.Add(OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange);
        }
    }
}