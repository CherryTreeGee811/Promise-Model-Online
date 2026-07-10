using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Serilog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Filters;
using PromiseModelOnline.Auth.Middleware;
using PromiseModelOnline.Auth.Services;

// Application entry point for the OpenID Connect Auth server.
// Configures EF Core (SQL Server), ASP.NET Identity, OpenIddict (authorization code + PKCE),
// Google OAuth, CORS, Kestrel HTTPS, data protection, and middleware pipeline.
// Seeds OpenIddict applications and development users on startup in development mode.

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? builder.Configuration["AUTH_AUTHORITY"]
    ?? appBaseUrl;

AppUrls.BaseUrl = appBaseUrl.TrimEnd('/');
AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');

// CORS policy allowing the SPA origin, BFF origin, and any configured additional origins.
builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        var extraOrigins = (builder.Configuration["Auth:AdditionalRedirectUris"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(o => new Uri(o.Trim()).GetLeftPart(UriPartial.Authority));

        policy.WithOrigins(
            [AppUrls.BaseUrl, "https://promisemodelonline.bff:8010", .. extraOrigins])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// EF Core with SQL Server connection string (supports Docker secret resolution).
var connectionString = builder.Configuration
    .GetConnectionString("MSSQL")?
    .ResolveSecrets();

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:MSSQL is required.");

builder.Services.AddDbContext<AuthorizationDbContext>(options =>
    options.UseSqlServer(connectionString));

// ASP.NET Identity with EF Core stores, default token providers, and application cookie configuration.
builder.Services
    .AddIdentity<IdentityUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AuthorizationDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "__Host-pmo.auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.Path = "/";

    options.LoginPath = "/account/login";
    options.LogoutPath = "/connect/logout";
    options.AccessDeniedPath = "/account/access-denied";
});

builder.Services.AddAntiforgery(options =>
{
    options.Cookie.Name = ".AspNetCore.Antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// OpenIddict server with authorization code flow, PKCE, certificate configuration, and custom scopes.
builder.Services.AddOpenIddictServerConfig(
    builder.Configuration,
    builder.Environment);

// Google OAuth 2.0 authentication with PKCE, configured from environment or Docker secrets.
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
if (!string.IsNullOrWhiteSpace(googleClientId))
{
    var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    if (string.IsNullOrEmpty(googleClientSecret))
    {
        var secretFile = builder.Configuration["Authentication:Google:ClientSecret_FILE"];
        if (!string.IsNullOrWhiteSpace(secretFile) && File.Exists(secretFile))
            googleClientSecret = (await File.ReadAllTextAsync(secretFile).ConfigureAwait(false)).Trim();
    }

    if (string.IsNullOrWhiteSpace(googleClientSecret))
        throw new InvalidOperationException("Authentication:Google:ClientSecret is required.");

    builder.Services.AddAuthentication()
        .AddGoogle(googleOptions =>
        {
            googleOptions.ClientId = googleClientId;
            googleOptions.ClientSecret = googleClientSecret;
            googleOptions.CallbackPath = "/signin-google";
            googleOptions.SaveTokens = false;
            googleOptions.UsePkce = true;

            googleOptions.Scope.Clear();
            googleOptions.Scope.Add("openid");
            googleOptions.Scope.Add("profile");
            googleOptions.Scope.Add("email");

            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "id");
            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.Name, "name");
            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
        });
}

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Data protection key persistence for horizontal scaling across multiple instances.
var dpKeysPath = builder.Configuration["DATA_PROTECTION_KEYS_PATH"]
    ?? Path.Combine(Directory.GetCurrentDirectory(), "dp-keys");

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("PromiseModelOnline.Auth");

// In-memory cache for verification codes and rate limiting counters.
builder.Services.AddMemoryCache();

// SendGrid email service for transactional emails (verification codes).
// Falls back to a no-op logger if SendGrid is not configured.
var sendGridApiKey = builder.Configuration["SendGrid:ApiKey"];
if (string.IsNullOrEmpty(sendGridApiKey))
{
    var sendGridFile = builder.Configuration["SendGrid:ApiKey_FILE"];
    if (!string.IsNullOrEmpty(sendGridFile) && File.Exists(sendGridFile))
        sendGridApiKey = (await File.ReadAllTextAsync(sendGridFile).ConfigureAwait(false)).Trim();
}

if (!string.IsNullOrEmpty(sendGridApiKey))
    builder.Services.AddSingleton<IEmailService, EmailService>();
else
    builder.Services.AddSingleton<IEmailService, NoOpEmailService>();

// Kestrel HTTPS with certificate file support; MVC controllers and views.
builder.ConfigureHttps();
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 102_400; // 100 KB
});
builder.Services.AddSingleton<IHtmlInputSanitizer, HtmlInputSanitizer>();
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add<InputSanitizationFilter>();
});

var app = builder.Build();

// Apply pending EF Core migrations at startup.
app.ApplyMigrations();

// Global exception handler — catches all unhandled exceptions, logs details
// via Serilog, returns a sanitized JSON error (no stack traces exposed).
app.UseMiddleware<GlobalExceptionMiddleware>();

// Seed OpenIddict applications (all environments) and development users (development only).
using var seedScope = app.Services.CreateScope();

await OpenIddictSeeder.SeedAsync(seedScope.ServiceProvider);
if (app.Environment.IsDevelopment())
{
    await AuthorizationSeeder.SeedAsync(seedScope.ServiceProvider);
}

// Forwarded headers for reverse proxy scenarios (X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host).
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost
};

forwardedOptions.KnownIPNetworks.Clear();
forwardedOptions.KnownProxies.Clear();

app.UseForwardedHeaders(forwardedOptions);

app.UseMiddleware<ForwardedHeadersFixMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseStaticFiles();
app.UseCors("SPA");
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultControllerRoute();

// Development-only endpoint to reset Identity lockout for test users.
// Not exposed in production — guarded by IsDevelopment().
if (app.Environment.IsDevelopment())
{
    app.MapPost("/account/dev/reset-lockout", async (
        string username,
        string? password,
        UserManager<IdentityUser> userManager) =>
    {
        if (string.IsNullOrWhiteSpace(username))
            return Results.BadRequest("Username is required.");
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
            return Results.NotFound($"User '{username}' not found.");
        await userManager.ResetAccessFailedCountAsync(user);
        await userManager.SetLockoutEndDateAsync(user, null);
        if (!string.IsNullOrWhiteSpace(password))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var result = await userManager.ResetPasswordAsync(user, token, password);
            if (!result.Succeeded)
                return Results.Problem(
                    $"Password reset failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
        return Results.Ok(new { username, status = "lockout_reset", passwordReset = password is not null });
    }).AllowAnonymous();
}

await app.RunAsync();
