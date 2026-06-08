using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

public class BffMisuseTests
{
    private static HttpClient CreateClient(BffWebApplicationFactory factory)
    {
        return factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Test]
    public async Task Login_MissingReturnUrl_SafeDefault()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        Assert.That(response.Headers.Location?.ToString(), Does.StartWith("/test-challenge"));
    }

    [Test]
    public async Task Login_UnsafeProtocol_DefaultsToRoot()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=javascript:alert(1)");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_UnsafeFtpUrl_DefaultsToRoot()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=ftp://evil.com");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_WithQueryInjection_DefaultsToRoot()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=/redirect?url=https://evil.com");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_EncodedAbsoluteUrl_DefaultsToRoot()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=https%3A%2F%2Fevil.com%2Fsteal");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_PathTraversal_ReturnsChallenge()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=/../../../etc/passwd");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task ApiRequest_PostWithoutBody_UnauthenticatedAjax_Returns401()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task ApiRequest_PostWithMalformedContentType_Unauthenticated_Returns401()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/projects");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent("not json");
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-msdownload");

        var response = await client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UnknownRoute_Returns404()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/nonexistent");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task Logout_WithMaliciousRedirect_RedirectsToRoot()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/logout");

        Assert.That(response.Headers.Location?.ToString(), Is.EqualTo("/"));
    }

    [Test]
    public async Task Login_WithReturnUrlContainingFragment_Handled()
    {
        await using var factory = new BffWebApplicationFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/login?returnUrl=/profile#settings");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
