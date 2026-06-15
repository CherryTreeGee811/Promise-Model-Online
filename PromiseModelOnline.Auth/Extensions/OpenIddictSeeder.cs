using OpenIddict.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using PromiseModelOnline.Auth.Common;

namespace PromiseModelOnline.Auth.Extensions
{
    /// <summary>Seeds the OpenIddict application registration (pmo-spa) into the database.</summary>
    /// <remarks>
    ///   Creates or updates the SPA client with authorization code grant, PKCE, and custom scopes
    ///   (<c>projects.read</c>, <c>projects.write</c>). Called at application startup.
    /// </remarks>
    public static class OpenIddictSeeder
    {
        /// <summary>Create or update the <c>pmo-spa</c> OpenIddict client application.</summary>
        /// <param name="services">The service provider to resolve the application manager.</param>
        public static async Task SeedAsync(IServiceProvider services)
        {
            var manager = services.GetRequiredService<IOpenIddictApplicationManager>();

            var descriptor = new OpenIddictApplicationDescriptor
            {
                ClientId = "pmo-spa",
                ClientType = OpenIddictConstants.ClientTypes.Public,
                DisplayName = "PMO BFF Client",
                RedirectUris =
                {
                    new Uri($"{AppUrls.BaseUrl}/signin-oidc")
                },
                PostLogoutRedirectUris =
                {
                    new Uri(AppUrls.BaseUrl)
                }
            };

            AddPermissions(descriptor);

            var existing = await manager.FindByClientIdAsync("pmo-spa");

            if (existing is null)
            {
                await manager.CreateAsync(descriptor);
            }
            else
            {
                await manager.UpdateAsync(existing, descriptor);
            }
        }

        /// <summary>Add required endpoints, grant types, scopes, and PKCE requirement to the client descriptor.</summary>
        /// <param name="descriptor">The application descriptor to add permissions to.</param>
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
