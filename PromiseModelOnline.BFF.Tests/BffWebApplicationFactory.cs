using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

/// <summary>Custom <see cref="WebApplicationFactory{TEntryPoint}"/> for BFF integration tests.</summary>
/// <remarks>
///   Configures the test environment with mock authentication handlers
///   (<see cref="TestAuthHandler"/>, <see cref="TestChallengeHandler"/>) and
///   an in-memory reverse proxy destination for isolated testing.
/// </remarks>
public class BffWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object _lock = new();
    private static bool _varsSet;

    /// <summary>Captured log entries from the test server for assertions.</summary>
    public LogCapture LogCapture { get; } = new();

    /// <summary>Initializes the factory and sets required environment variables.</summary>
    public BffWebApplicationFactory()
    {
        SetEnvVars();
    }

    /// <summary>Set environment variables required by the BFF. Thread-safe, runs once.</summary>
    private static void SetEnvVars()
    {
        if (_varsSet) return;
        lock (_lock)
        {
            if (_varsSet) return;
            Environment.SetEnvironmentVariable("AUTH_PUBLIC_ISSUER", "http://localhost");
            Environment.SetEnvironmentVariable("AUTH_METADATA_ADDRESS", "http://localhost/.well-known/openid-configuration");
            Environment.SetEnvironmentVariable("APP_BASE_URL", "http://localhost");
            _varsSet = true;
        }
    }

    /// <summary>Configure the web host with mock authentication and in-memory proxy config.</summary>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ReverseProxy:Clusters:api-cluster:Destinations:api:Address"] = "http://localhost:8999"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // Remove Serilog's logger factory so standard ILoggerProvider instances work
            services.RemoveAll<ILoggerFactory>();

            services.AddTransient<TestAuthHandler>();
            services.AddTransient<TestChallengeHandler>();
            services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddProvider(LogCapture);
            });

            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultScheme = "cookie";
                options.DefaultChallengeScheme = "oidc";

                if (options.SchemeMap.TryGetValue("cookie", out var cookieScheme))
                    cookieScheme.HandlerType = typeof(TestAuthHandler);

                if (options.SchemeMap.TryGetValue("oidc", out var oidcScheme))
                    oidcScheme.HandlerType = typeof(TestChallengeHandler);
            });
        });
    }

    /// <summary>Create an HTTP client with optional redirect following.</summary>
    /// <param name="allowAutoRedirect">Whether to follow redirect responses.</param>
    public HttpClient CreateClient(bool allowAutoRedirect)
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = allowAutoRedirect
        });
    }
}
