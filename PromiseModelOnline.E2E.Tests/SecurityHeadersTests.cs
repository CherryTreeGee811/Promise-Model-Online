using System.Net;

namespace PromiseModelOnline.E2E.Tests;

public class SecurityHeadersTests : E2ETestBase
{
    [Test]
    public async Task SPA_ReturnsCspHeader()
    {
        var response = await GetAsync("/");
        Assert.That(response.Headers.Contains("Content-Security-Policy"), Is.True,
            "CSP header should be present on SPA responses");
    }

    [Test]
    public async Task SPA_CspRestrictsScriptSources()
    {
        var response = await GetAsync("/");
        var csp = response.Headers.GetValues("Content-Security-Policy").FirstOrDefault();
        Assert.That(csp, Does.Contain("default-src 'none'"), "CSP should set default-src 'none'");
        Assert.That(csp, Does.Contain("script-src 'self'"), "CSP should restrict script-src");
    }

    [Test]
    public async Task Login_ReturnsRedirect()
    {
        var response = await GetAsync("/login?returnUrl=/");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task ApiRequest_Ajax_Returns401_WhenUnauthenticated()
    {
        var response = await GetAsync("/api/projects", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task HubsRequest_Ajax_Returns401_WhenUnauthenticated()
    {
        var response = await GetAsync("/hubs/notifications", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UnknownRoute_Returns404()
    {
        var response = await GetAsync("/nonexistent");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
