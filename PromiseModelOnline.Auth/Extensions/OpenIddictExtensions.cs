using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.DAL;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;
using PromiseModelOnline.Auth.Common;

namespace PromiseModelOnline.Auth.Extensions;

/// <summary>Extension methods for configuring OpenIddict server and validation.</summary>
public static class OpenIddictExtensions
{
    /// <summary>Register OpenIddict with EF Core storage, authorization code + refresh token flows, PKCE, and certificate configuration.</summary>
    /// <param name="services">The service collection to register into.</param>
    /// <param name="config">The application configuration for certificate loading.</param>
    /// <param name="env">The web hosting environment for development-mode overrides.</param>
    /// <returns>The same service collection for chaining.</returns>
    public static IServiceCollection AddOpenIddictServerConfig(
        this IServiceCollection services,
        IConfiguration config,
        IWebHostEnvironment env)
    {
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
                    .SetRevocationEndpointUris("/connect/revoke");

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

        return services;
    }

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

            options.AddSigningCertificate(cert);
            options.AddEncryptionCertificate(cert);
        }
        else
        {
            options.AddEphemeralEncryptionKey();
            options.AddEphemeralSigningKey();
        }
    }
}
