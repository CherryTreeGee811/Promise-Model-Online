using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class AuthWebApplicationFactory : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    private WebApplication _app = null!;

    public AuthWebApplicationFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    public async Task InitializeAsync()
    {
        var appBaseUrl = Environment.GetEnvironmentVariable("APP_BASE_URL")
            ?? throw new InvalidOperationException("APP_BASE_URL is required.");

        var publicIssuer = Environment.GetEnvironmentVariable("AUTH_PUBLIC_ISSUER") ?? appBaseUrl;

        AppUrls.BaseUrl = appBaseUrl.TrimEnd('/');
        AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Development"
        });

        builder.WebHost.UseTestServer();

        // CORS
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("SPA", policy =>
            {
                policy.WithOrigins(AppUrls.BaseUrl, "https://promisemodelonline.bff:8010")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        // Database
        builder.Services.AddDbContext<AuthorizationDbContext>(options =>
            options.UseSqlite(_connection));

        // Identity
        builder.Services
            .AddIdentity<IdentityUser, IdentityRole>()
            .AddEntityFrameworkStores<AuthorizationDbContext>()
            .AddDefaultTokenProviders()
            .AddSignInManager();

        builder.Services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "pmo.auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.Path = "/";
            options.LoginPath = "/account/login";
            options.LogoutPath = "/connect/logout";
            options.AccessDeniedPath = "/account/access-denied";
        });

        // OpenIddict
        builder.Services.AddOpenIddictServerConfig(
            builder.Configuration,
            builder.Environment);

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = IdentityConstants.ApplicationScheme;
        });

        builder.Services.AddAuthorization();

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

        builder.Services.AddControllersWithViews()
            .AddApplicationPart(typeof(PromiseModelOnline.Auth.Controllers.LoginController).Assembly);

        _app = builder.Build();

        // Apply migrations and seed
        using (var scope = _app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AuthorizationDbContext>();
            db.Database.EnsureCreated();
            await OpenIddictSeeder.SeedAsync(scope.ServiceProvider);
            await AuthorizationSeeder.SeedAsync(scope.ServiceProvider);
        }

        // Forwarded headers
        var forwardedOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
        };
        forwardedOptions.KnownIPNetworks.Clear();
        forwardedOptions.KnownProxies.Clear();
        _app.UseForwardedHeaders(forwardedOptions);

        _app.UseMiddleware<SecurityHeadersMiddleware>();
        _app.UseStaticFiles();
        _app.UseCors("SPA");
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.UseRateLimiter();
        _app.MapDefaultControllerRoute();

        await _app.StartAsync();
    }

    public TestServer Server => _app.GetTestServer()!;

    public HttpClient CreateClient() => _app.GetTestClient()!;

    public async ValueTask DisposeAsync()
    {
        if (_app is not null)
            await _app.DisposeAsync();
        if (_connection is not null)
            await _connection.DisposeAsync();
    }
}
