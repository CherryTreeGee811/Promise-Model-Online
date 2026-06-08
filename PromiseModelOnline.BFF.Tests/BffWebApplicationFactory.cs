using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Options;

namespace PromiseModelOnline.BFF.Tests;

public class BffWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object _lock = new();
    private static bool _varsSet;

    public BffWebApplicationFactory()
    {
        SetEnvVars();
    }

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
            services.AddTransient<TestAuthHandler>();
            services.AddTransient<TestChallengeHandler>();

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

    public HttpClient CreateClient(bool allowAutoRedirect)
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = allowAutoRedirect
        });
    }
}
