using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.DAL.Interfaces;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;
using PromiseModelOnline.Auth.Services;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class AuthWebApplicationFactory : IAsyncDisposable
{
    private static readonly SemaphoreSlim _initLock = new(1, 1);
    private static bool _initialized;
    private static WebApplication _cachedApp = null!;
    private static SqliteConnection? _currentTestConnection;

    private readonly SqliteConnection _connection;

    public AuthWebApplicationFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    public async Task InitializeAsync()
    {
        _currentTestConnection = _connection;
        var baseUrl = (Environment.GetEnvironmentVariable("APP_BASE_URL") ?? "https://localhost:9000").TrimEnd('/');
        var publicIssuer = (Environment.GetEnvironmentVariable("AUTH_PUBLIC_ISSUER") ?? baseUrl).TrimEnd('/');
        AppUrls.BaseUrl = baseUrl;
        AppUrls.PublicIssuer = publicIssuer;

        await EnsureAppStartedAsync();

        using var scope = _cachedApp.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthorizationDbContext>();
        db.Database.EnsureCreated();
        await OpenIddictSeeder.SeedAsync(scope.ServiceProvider);
        await AuthorizationSeeder.SeedAsync(scope.ServiceProvider);
    }

    private static async Task EnsureAppStartedAsync()
    {
        if (_initialized) return;
        await _initLock.WaitAsync();
        try
        {
            if (_initialized) return;

            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                EnvironmentName = "Development"
            });

            builder.WebHost.UseTestServer();

            builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
            builder.Logging.AddFilter("Microsoft.AspNetCore.StaticFiles", LogLevel.Warning);

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

            // Database — uses static reference set by each test before making requests
            builder.Services.AddScoped<AuthorizationDbContext>(sp =>
            {
                var conn = _currentTestConnection
                    ?? throw new InvalidOperationException("No test connection. Call InitializeAsync.");
                var options = new DbContextOptionsBuilder<AuthorizationDbContext>()
                    .UseSqlite(conn)
                    .Options;
                return new AuthorizationDbContext(options);
            });
            builder.Services.AddScoped<IAuthorizationDbContext>(sp =>
                sp.GetRequiredService<AuthorizationDbContext>());

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
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.Path = "/";
                options.LoginPath = "/account/login";
                options.LogoutPath = "/connect/logout";
                options.AccessDeniedPath = "/account/access-denied";
            });

            builder.Services.AddOpenIddictServerConfig(
                builder.Configuration,
                builder.Environment);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
            });

            builder.Services.AddAuthorization();
            builder.Services.AddMemoryCache();

            builder.Services.AddSingleton<IEmailService>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<StubEmailService>>();
                return new StubEmailService(logger);
            });

            builder.Services.AddControllersWithViews()
                .AddApplicationPart(typeof(PromiseModelOnline.Auth.Controllers.LoginController).Assembly);

            _cachedApp = builder.Build();

            var forwardedOptions = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
            };
            forwardedOptions.KnownIPNetworks.Clear();
            forwardedOptions.KnownProxies.Clear();
            _cachedApp.UseForwardedHeaders(forwardedOptions);

            _cachedApp.UseMiddleware<SecurityHeadersMiddleware>();
            _cachedApp.UseStaticFiles();
            _cachedApp.UseCors("SPA");
            _cachedApp.UseAuthentication();
            _cachedApp.UseAuthorization();
            _cachedApp.MapDefaultControllerRoute();

            await _cachedApp.StartAsync();
            _initialized = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    public TestServer Server => _cachedApp!.GetTestServer()!;

    public HttpClient CreateClient() => _cachedApp!.GetTestClient()!;

    public async ValueTask DisposeAsync()
    {
        _currentTestConnection = null;
        if (_connection is not null)
            await _connection.DisposeAsync();
    }

    public static async ValueTask DisposeAppAsync()
    {
        if (_cachedApp is not null)
            await _cachedApp.DisposeAsync();
    }
}
