using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.RateLimiting;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;
using PromiseModelOnline.Auth.Common;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

AppUrls.BaseUrl = builder.Configuration["APP_BASE_URL"] ?? "";

builder.Configuration.AddSecretFileResolver();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins(AppUrls.BaseUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var connectionString = builder.Configuration
    .GetConnectionString("MSSQL")?
    .ResolveSecrets() ?? "";

builder.Services.AddDbContext<AuthorizationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthorizationDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.AddOpenIddictServerConfig(
    builder.Configuration,
    builder.Environment
);

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
app.UseMiddleware<ForwardedHeadersFixMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseStaticFiles();
app.UseCors("SPA");
app.UseMiddleware<TokenCookieMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapDefaultControllerRoute();
app.Run();