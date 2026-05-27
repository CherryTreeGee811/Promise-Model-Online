using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.DAL;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class OpenIddictExtensions
    {
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
                        .RequireProofKeyForCodeExchange();

                    options.SetRefreshTokenLifetime(TimeSpan.FromDays(7));
                    options.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));

                    var aspNetCoreBuilder = options.UseAspNetCore()
                        .EnableAuthorizationEndpointPassthrough()
                        .EnableTokenEndpointPassthrough()
                        .EnableEndSessionEndpointPassthrough()
                        .EnableStatusCodePagesIntegration();

                    if (env.IsDevelopment())
                        aspNetCoreBuilder.DisableTransportSecurityRequirement();
                })
                .AddValidation(options =>
                {
                    options.UseLocalServer();
                    options.UseAspNetCore();
                });

            return services;
        }

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
}