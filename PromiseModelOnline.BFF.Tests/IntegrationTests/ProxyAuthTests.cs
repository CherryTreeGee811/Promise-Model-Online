using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

/// <summary>Integration tests for BFF reverse proxy authentication enforcement.</summary>
// Requirements: REQ_INT_002 REQ_INT_016
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
    [Description("REQ_INT_002 + REQ-SEC-LOG-001: Unauthenticated AJAX request to API returns 401 and logs warning")]
    public async Task REQ_INT_002_ApiRequest_Unauthenticated_Ajax_Returns401()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        factory.LogCapture.ShouldContainWarning("unauthenticated AJAX request");
    }

    [Test]
    public async Task REQ_INT_002_ApiRequest_Unauthenticated_JsonAccept_Returns401()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add("Accept", "application/json");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_ApiRequest_Unauthenticated_Browser_RedirectsToChallenge()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/api/projects");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_INT_002_ApiRequest_Authenticated_ProxiesToBackend()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        request.Headers.Add(TestAuthHandler.AuthenticateHeader, "true");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadGateway));
    }

    [Test]
    public async Task REQ_INT_002_HubsRequest_Unauthenticated_Ajax_Returns401()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/hubs/notifications");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_002_HubsRequest_Unauthenticated_Browser_RedirectsToChallenge()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/hubs/notifications");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_INT_002_HubsRequest_Authenticated_ProxiesToBackend()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Get, "/hubs/notifications");
        request.Headers.Add(TestAuthHandler.AuthenticateHeader, "true");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadGateway));
    }

    [Test]
    public async Task REQ_INT_002_NonProxyPath_DoesNotTriggerProxyAuth()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/health");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
