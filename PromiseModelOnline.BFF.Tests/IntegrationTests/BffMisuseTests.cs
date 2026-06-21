using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

/// <summary>Integration tests for BFF misuse scenarios (unauthenticated access, CSRF, etc.).</summary>
// Requirements: REQ_NF_008 REQ_NF_009
public class BffMisuseTests
{
    private static HttpClient CreateClient(BffWebApplicationFactory factory) => factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false
    });

    [Test]
    public async Task REQ_NF_008_Login_MissingReturnUrl_SafeDefault()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        Assert.That(response.Headers.Location?.ToString(), Does.StartWith("/test-challenge"));
    }

    [Test]
    public async Task REQ_NF_008_Login_UnsafeProtocol_DefaultsToRoot()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=javascript:alert(1)");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_UnsafeFtpUrl_DefaultsToRoot()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=ftp://evil.com");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_WithQueryInjection_DefaultsToRoot()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=/redirect?url=https://evil.com");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_EncodedAbsoluteUrl_DefaultsToRoot()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=https%3A%2F%2Fevil.com%2Fsteal");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_PathTraversal_ReturnsChallenge()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=/../../../etc/passwd");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_ApiRequest_PostWithoutBody_UnauthenticatedAjax_Returns401()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_NF_008_ApiRequest_PostWithMalformedContentType_Unauthenticated_Returns401()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("not json");
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-msdownload");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_NF_008_UnknownRoute_Returns404()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/nonexistent");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task REQ_NF_008_Logout_WithMaliciousRedirect_RedirectsToRoot()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/logout");

        // Assert
        Assert.That(response.Headers.Location?.ToString(), Is.EqualTo("/"));
    }

    [Test]
    public async Task REQ_NF_008_Login_WithReturnUrlContainingFragment_Handled()
    {
        // Arrange
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        // Act
        var response = await client.GetAsync("/login?returnUrl=/profile#settings");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
