using OpenIddict.Abstractions;
using Microsoft.IdentityModel.Tokens;
using PromiseModelOnline.Auth.DAL;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;
using PromiseModelOnline.Auth.Common;

namespace PromiseModelOnline.Auth.Extensions;

/// <summary>OpenIddict server and validation configuration.</summary>
/// <remarks>Configures the authorization and token endpoints, PKCE enforcement, certificate loading, and client seeding.</remarks>
public static class OpenIddictExtensions
{
    /// <summary>Configure the OpenIddict server with authorization code flow, PKCE, and custom scopes.</summary>
    /// <param name="services">The service collection to add OpenIddict to.</param>
    /// <param name="config">The application configuration for certificate and issuer settings.</param>
    /// <param name="env">The web host environment for dev-mode configuration.</param>
    public static void AddOpenIddictServerConfig(
        this IServiceCollection services,
        IConfiguration config,
        IWebHostEnvironment env) =>
        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                    .UseDbContext<AuthorizationDbContext>();
            })
            .AddServer(options =>
            {
                options.SetIssuer(new Uri(AppUrls.PublicIssuer));

                ConfigureCertificates(options, config);

                options.RegisterScopes(
                    OpenIddictConstants.Scopes.OpenId,
                    OpenIddictConstants.Scopes.Profile,
                    OpenIddictConstants.Scopes.Email,
                    OpenIddictConstants.Scopes.OfflineAccess,
                    "projects.read",
                    "projects.write"
                );

                options.SetAuthorizationEndpointUris("/connect/authorize")
                    .SetTokenEndpointUris("/connect/token")
                    .SetEndSessionEndpointUris("/connect/logout")
                    .SetIntrospectionEndpointUris("/connect/introspect")
                    .SetRevocationEndpointUris("/connect/revoke")
                    .SetPushedAuthorizationEndpointUris("/connect/authorize/pushed")
                    .RequirePushedAuthorizationRequests();

                options.AllowAuthorizationCodeFlow()
                    .AllowRefreshTokenFlow()
                    .RequireProofKeyForCodeExchange()
                    .SetRefreshTokenReuseLeeway(TimeSpan.Zero);

                options.SetAuthorizationCodeLifetime(TimeSpan.FromMinutes(10));
                options.SetRefreshTokenLifetime(TimeSpan.FromDays(7));
                options.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));

                options.DisableAccessTokenEncryption();

                var aspNetCoreBuilder = options.UseAspNetCore()
                    .EnableAuthorizationEndpointPassthrough()
                    .EnableEndSessionEndpointPassthrough()
                    .EnableStatusCodePagesIntegration();

                if (env.IsDevelopment())
                {
                    aspNetCoreBuilder.DisableTransportSecurityRequirement();
                }
            })
            .AddValidation(options =>
            {
                options.UseLocalServer();
                options.UseAspNetCore();
            });

    /// <summary>Load the signing/encryption certificate from <c>cert.pfx</c> or fall back to ephemeral keys for development.</summary>
    /// <param name="options">The OpenIddict server builder to configure.</param>
    /// <param name="config">The application configuration for the certificate password.</param>
    private static void ConfigureCertificates(OpenIddictServerBuilder options, IConfiguration config)
    {
        var certPath = Path.Combine(Directory.GetCurrentDirectory(), "cert.pfx");

        var certPassword = config["Certificates:Password"];

        if (string.IsNullOrEmpty(certPassword))
        {
            var filePath = config["Certificates:Password_FILE"];

            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                certPassword = File.ReadAllText(filePath).Trim();
        }

        if (File.Exists(certPath))
        {
            var cert = X509CertificateLoader.LoadPkcs12(
                File.ReadAllBytes(certPath),
                certPassword,
                X509KeyStorageFlags.MachineKeySet |
                X509KeyStorageFlags.PersistKeySet |
                X509KeyStorageFlags.Exportable);

            var ecdsaKey = cert.GetECDsaPrivateKey();
            if (ecdsaKey is not null)
            {
                options.AddSigningCredentials(
                    new SigningCredentials(
                        new ECDsaSecurityKey(ecdsaKey),
                        SecurityAlgorithms.EcdsaSha256));
                options.AddEphemeralEncryptionKey();
            }
            else
            {
                options.AddSigningCertificate(cert);
                options.AddEncryptionCertificate(cert);
            }
        }
        else
        {
            options.AddEphemeralEncryptionKey();
            options.AddEphemeralSigningKey();
        }
    }

    /// <summary>Seed the <c>pmo-spa</c> OpenIddict client application for the BFF.</summary>
    /// <param name="services">The service provider used to resolve the application manager.</param>
    public static async Task SeedAsync(IServiceProvider services)
    {
        var manager = services.GetRequiredService<IOpenIddictApplicationManager>();
        var config = services.GetRequiredService<IConfiguration>();

        var extraUris = (config["Auth:AdditionalRedirectUris"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(u => new Uri(u.Trim()));

        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = "pmo-spa",
            ClientType = OpenIddictConstants.ClientTypes.Public,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
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

        foreach (var uri in extraUris)
            descriptor.RedirectUris.Add(uri);

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
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.PushedAuthorization);
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
