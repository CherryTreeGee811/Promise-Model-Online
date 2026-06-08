using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

public class ProxyAuthTests
{
    private static HttpClient CreateClient(BffWebApplicationFactory factory)
    {
        return factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Test]
    public async Task ApiRequest_Unauthenticated_Ajax_Returns401()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiRequest_Unauthenticated_JsonAccept_Returns401()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add("Accept", "application/json");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiRequest_Unauthenticated_Browser_RedirectsToChallenge()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/projects");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task ApiRequest_Authenticated_ProxiesToBackend()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add(TestAuthHandler.AuthenticateHeader, "true");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadGateway));
    }

    [Test]
    public async Task HubsRequest_Unauthenticated_Ajax_Returns401()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/hubs/notifications");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task HubsRequest_Unauthenticated_Browser_RedirectsToChallenge()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/hubs/notifications");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task HubsRequest_Authenticated_ProxiesToBackend()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/hubs/notifications");
        request.Headers.Add(TestAuthHandler.AuthenticateHeader, "true");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadGateway));
    }

    [Test]
    public async Task NonProxyPath_DoesNotTriggerProxyAuth()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/health");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
