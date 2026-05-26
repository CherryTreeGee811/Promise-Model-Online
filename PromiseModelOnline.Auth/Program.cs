using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.RateLimiting;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddSecretFileResolver();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins("https://localhost:9000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("MSSQL") ?? "";;

if (connectionString.Contains("Password_FILE="))
{
    var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();

    for (int i = 0; i < parts.Count; i++)
    {
        if (parts[i].StartsWith("Password_FILE="))
        {
            var filePath = parts[i].Substring("Password_FILE=".Length);

            if (File.Exists(filePath))
            {
                var password = File.ReadAllText(filePath).Trim();
                parts[i] = $"Password={password}";
            }
        }
    }

    connectionString = string.Join(';', parts);
}

builder.Services.AddDbContext<AuthorizationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthorizationDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
               .UseDbContext<AuthorizationDbContext>();
    })
    .AddServer(options =>
    {
        var certPath     = Path.Combine(Directory.GetCurrentDirectory(), "cert.pfx");
        var certPassword = builder.Configuration["Certificates:Password"];

        if (string.IsNullOrEmpty(certPassword))
        {
            var filePath = builder.Configuration["Certificates:Password_FILE"];

            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                certPassword = File.ReadAllText(filePath).Trim();
        }

        if (File.Exists(certPath))
        {
            var signingCert = X509CertificateLoader.LoadPkcs12(
                File.ReadAllBytes(certPath),
                certPassword,
                X509KeyStorageFlags.MachineKeySet |
                X509KeyStorageFlags.PersistKeySet  |
                X509KeyStorageFlags.Exportable);

            options.AddSigningCertificate(signingCert);
            options.AddEncryptionCertificate(signingCert);
        }
        else
        {
            options.AddEphemeralEncryptionKey();
            options.AddEphemeralSigningKey();
        }

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

        // 7-day lifetime. TokenCookieMiddleware.CookieMaxAge must match this value.
        // If they drift, users get 400 errors instead of a clean re-login prompt.
        options.SetRefreshTokenLifetime(TimeSpan.FromDays(7));

        // Short access token lifetime — minimises the exposure window.
        // api.mjs refreshes transparently on 401 so users never notice.
        options.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));

        var aspNetCoreBuilder = options.UseAspNetCore()
               .EnableAuthorizationEndpointPassthrough()
               .EnableTokenEndpointPassthrough()
               .EnableEndSessionEndpointPassthrough()
               .EnableStatusCodePagesIntegration();

        // Dev-only: allows the auth server to operate when certs are absent or
        // the reverse proxy terminates TLS before reaching this service.
        // This must never run in production — remove the guard and HTTPS enforcement
        // is silently disabled for all environments.
        if (builder.Environment.IsDevelopment())
            aspNetCoreBuilder.DisableTransportSecurityRequirement();
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
    options.DefaultScheme             = IdentityConstants.ApplicationScheme;
    options.DefaultChallengeScheme    =
        OpenIddict.Validation.AspNetCore.OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("TokenEndpointPolicy", config =>
    {
        config.PermitLimit          = 30;
        config.Window               = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        config.QueueLimit           = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var certPathPem = Path.Combine(Directory.GetCurrentDirectory(), "cert.pem");
var keyPathPem  = Path.Combine(Directory.GetCurrentDirectory(), "key.pem");

if (File.Exists(certPathPem) && File.Exists(keyPathPem))
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(8060, listenOptions =>
        {
            var cert = X509Certificate2.CreateFromPemFile(certPathPem, keyPathPem);
            listenOptions.UseHttps(cert);
        });
    });
}
else
{
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8060";
    if (urls.Contains("https://")) urls = urls.Replace("https://", "http://");
    builder.WebHost.UseUrls(urls);
}

builder.Services.AddControllersWithViews();

var app = builder.Build();

app.ApplyMigrations();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await SeedOpenIddictClientAsync(scope.ServiceProvider);
    await AuthorizationSeeder.SeedAsync(scope.ServiceProvider);
}

var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders =
        ForwardedHeaders.XForwardedFor   |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost
};
// Safe in a containerised environment where only the nginx proxy is the ingress.
// If this service were ever exposed directly, remove these two lines and enumerate
// KnownProxies explicitly to avoid trusting spoofed X-Forwarded-* headers.
forwardedOptions.KnownIPNetworks.Clear();
forwardedOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedOptions);

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"]        = "DENY";

    if (context.Request.IsHttps)
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

    headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none';";

    await next();
});

app.UseStaticFiles();
app.UseCors("SPA");
app.UseMiddleware<TokenCookieMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapDefaultControllerRoute();
app.Run();

async Task SeedOpenIddictClientAsync(IServiceProvider services)
{
    var manager = services.GetRequiredService<IOpenIddictApplicationManager>();

    var existing = await manager.FindByClientIdAsync("pmo-spa");
    if (existing != null)
    {
        await manager.DeleteAsync(existing);
    }

    var descriptor = new OpenIddictApplicationDescriptor
    {
        ClientId    = "pmo-spa",
        DisplayName = "PMO SPA",
        RedirectUris           = { new Uri("https://localhost:9000/auth/callback") },
        PostLogoutRedirectUris = { new Uri("https://localhost:9000/") }
    };

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

    await manager.CreateAsync(descriptor);
}