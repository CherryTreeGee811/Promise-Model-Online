namespace PromiseModelOnline.BFF.Tests;

public class BffTestServer : IAsyncDisposable
{
    private readonly WebApplication _app;
    private readonly TestServer _server;

    public HttpClient Client { get; }

    public BffTestServer()
    {
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
