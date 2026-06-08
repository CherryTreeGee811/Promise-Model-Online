namespace PromiseModelOnline.BFF.Tests;

public class BffTestServer : IAsyncDisposable
{
    private readonly WebApplication _app;
    private readonly TestServer _server;

    public HttpClient Client { get; }

    private static readonly object _lock = new();
    private static bool _varsSet;

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

    public async ValueTask DisposeAsync()
    {
        await _app.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
