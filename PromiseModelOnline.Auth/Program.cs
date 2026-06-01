using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ---------- Auth/public URL config -------------------------------------
var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? builder.Configuration["AUTH_AUTHORITY"]
    ?? appBaseUrl;

AppUrls.BaseUrl = appBaseUrl.TrimEnd('/');
AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');

// Must happen before reading config values that may use *_FILE.
builder.Configuration.AddSecretFileResolver();

// ---------- CORS -------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins(
                AppUrls.BaseUrl,
                "https://promisemodelonline.gateway:8010")
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
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = IdentityConstants.ApplicationScheme;
});

builder.Services.AddAuthorization();

// ---------- Rate limiting ----------------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("TokenEndpointPolicy", config =>
    {
        config.PermitLimit = 30;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder =
            System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

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

app.UseRateLimiter();

app.MapDefaultControllerRoute();

app.Run();