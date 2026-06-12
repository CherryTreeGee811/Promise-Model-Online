using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

public class LoginEndpointTests
{
    [Test]
    public async Task Login_WithoutReturnUrl_RedirectsToChallenge()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/login");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        Assert.That(response.Headers.Location?.ToString(), Does.StartWith("/test-challenge"));
    }

    [Test]
    public async Task Login_WithSafeReturnUrl_RedirectsToChallenge()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/login?returnUrl=/projects/1");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_WithUnsafeAbsoluteUrl_DefaultsToRoot()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/login?returnUrl=https://evil.com");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_WithDoubleSlashUrl_DefaultsToRoot()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/login?returnUrl=//evil.com");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_WithBackslashUrl_DefaultsToRoot()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/login?returnUrl=/\\evil.com");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
