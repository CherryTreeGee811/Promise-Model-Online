using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.BFF.Tests;

/// <summary>Test server for BFF integration tests, providing an authenticated HTTP client.</summary>
/// <remarks>
///   Creates a <see cref="WebApplication"/> with a <c>TestServer</c> using mock authentication
///   handlers (<see cref="TestAuthHandler"/> for cookie, <see cref="TestChallengeHandler"/> for
///   OIDC). Sets required environment variables before building the app.
/// </remarks>
public class BffTestServer : IAsyncDisposable
{
    private readonly WebApplication _app;
    private readonly TestServer _server;

    /// <summary>HTTP client pre-configured with the test server's handler.</summary>
    public HttpClient Client { get; }

    /// <summary>Captured log entries from the test server for assertions.</summary>
    public LogCapture LogCapture { get; } = new();

    private static readonly object _lock = new();
    private static bool _varsSet;

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

    /// <summary>Build the test server with mock authentication and BFF endpoints.</summary>
    public BffTestServer()
    {
        SetEnvVars();

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Development"
        });

        builder.WebHost.UseTestServer();

        builder.Services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("cookie", null)
            .AddScheme<AuthenticationSchemeOptions, TestChallengeHandler>("oidc", null);

        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<ILoggerProvider>(LogCapture);

        _app = builder.Build();

        _app.UseAuthentication();
        _app.UseAuthorization();

        _app.MapBffEndpoints();

        _app.StartAsync().GetAwaiter().GetResult();
        _server = _app.GetTestServer()!;

        var handler = _server.CreateHandler();
        Client = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://localhost"),
            Timeout = TimeSpan.FromSeconds(15)
        };
    }

    /// <summary>Dispose the test server and suppress finalization.</summary>
    public async ValueTask DisposeAsync()
    {
        await _app.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
