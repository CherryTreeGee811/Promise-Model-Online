using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;
using PromiseModelOnline.Auth.Services;

var builder = WebApplication.CreateBuilder(args);

// ---------- Auth/public URL config -------------------------------------
var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? builder.Configuration["AUTH_AUTHORITY"]
    ?? appBaseUrl;

AppUrls.BaseUrl = appBaseUrl.TrimEnd('/');
AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');


// ---------- CORS -------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins(
                AppUrls.BaseUrl,
                "https://promisemodelonline.bff:8010")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ---------- Database ---------------------------------------------------
var connectionString = builder.Configuration
    .GetConnectionString("MSSQL")?
    .ResolveSecrets();

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:MSSQL is required.");
}

builder.Services.AddDbContext<AuthorizationDbContext>(options =>
    options.UseSqlServer(connectionString));

// ---------- Identity ---------------------------------------------------
builder.Services
    .AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthorizationDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "pmo.auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.Path = "/";

    options.LoginPath = "/account/login";
    options.LogoutPath = "/connect/logout";
    options.AccessDeniedPath = "/account/access-denied";
});

// ---------- OpenIddict -------------------------------------------------
builder.Services.AddOpenIddictServerConfig(
    builder.Configuration,
    builder.Environment);

// Identity already configures the application cookie scheme.
// This explicit config is acceptable, but not strictly required.
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
if (!string.IsNullOrWhiteSpace(googleClientId))
{
    var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    if (string.IsNullOrEmpty(googleClientSecret))
    {
        var secretFile = builder.Configuration["Authentication:Google:ClientSecret_FILE"];
        if (!string.IsNullOrWhiteSpace(secretFile) && File.Exists(secretFile))
            googleClientSecret = File.ReadAllText(secretFile).Trim();
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

builder.Services.AddAuthorization();

// ---------- Data Protection (shared key ring for horizontal scaling) ---
var dpKeysPath = builder.Configuration["DATA_PROTECTION_KEYS_PATH"]
    ?? Path.Combine(Directory.GetCurrentDirectory(), "dp-keys");

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("PromiseModelOnline.Auth");

// ---------- Caching --------------------------------------------------
builder.Services.AddMemoryCache();

// ---------- Email ----------------------------------------------------
builder.Services.AddSingleton<IEmailService, EmailService>();

// ---------- Rate limiting ----------------------------------------------
// Custom middleware instead of AddRateLimiter/UseRateLimiter because
// OpenIddict's internal token endpoint handler processes requests before
// the built-in rate limiter middleware can intercept them. The custom
// middleware runs at the top of the pipeline and uses FixedWindowRateLimiter
// instances directly.
// (No services registration needed; the middleware creates limiter instances
//  at construction time.)

// ---------- HTTPS / MVC ------------------------------------------------
builder.ConfigureHttps();
builder.Services.AddControllersWithViews();

var app = builder.Build();

app.ApplyMigrations();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    await OpenIddictSeeder.SeedAsync(scope.ServiceProvider);
    await AuthorizationSeeder.SeedAsync(scope.ServiceProvider);
}

// ---------- Forwarded headers ------------------------------------------
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost
};

// Safe only while Auth is not directly exposed publicly.
forwardedOptions.KnownIPNetworks.Clear();
forwardedOptions.KnownProxies.Clear();

app.UseForwardedHeaders(forwardedOptions);

// This middleware is probably redundant if UseForwardedHeaders is correctly configured,
// but keeping it is okay during local debugging.
app.UseMiddleware<ForwardedHeadersFixMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseStaticFiles();

app.UseCors("SPA");

app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultControllerRoute();

app.Run();