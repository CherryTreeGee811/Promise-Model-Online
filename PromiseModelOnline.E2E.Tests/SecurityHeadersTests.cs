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
    public async Task UnknownRoute_ReturnsSPAIndex()
    {
        // SPA router handles client-side failures; nginx serves index.html
        var response = await GetAsync("/nonexistent");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task CSP_IncludesManifestSrc()
    {
        var response = await GetAsync("/");
        var csp = response.Headers.GetValues("Content-Security-Policy").FirstOrDefault();
        Assert.That(csp, Does.Contain("manifest-src 'self'"), "CSP should allow manifest-src 'self'");
    }

    [Test]
    public async Task ManifestJson_ServedCorrectly()
    {
        var response = await GetAsync("/manifest.json");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/json"));
    }

    [Test]
    public async Task ServiceWorker_ServedCorrectly()
    {
        var response = await GetAsync("/sw.mjs");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.That(contentType, Is.EqualTo("application/javascript").Or.EqualTo("text/javascript"));
    }

    [Test]
    public async Task SPA_IncludesManifestLink()
    {
        var html = await Client.GetStringAsync("/");
        Assert.That(html, Does.Contain("rel=\"manifest\" href=\"/manifest.json\""));
    }

    [Test]
    public async Task RobotsTxt_ServedCorrectly()
    {
        var response = await GetAsync("/robots.txt");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("text/plain"));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("User-agent: *"));
        Assert.That(body, Does.Contain("Disallow: /api/"));
        Assert.That(body, Does.Contain("Disallow: /login"));
        Assert.That(body, Does.Contain("Sitemap: https://localhost/sitemap.xml"));
        Assert.That(body, Does.Not.Contain("Allow: /"));
    }

    [Test]
    public async Task SitemapXml_ServedCorrectly()
    {
        var response = await GetAsync("/sitemap.xml");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/xml"));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("<loc>https://localhost/</loc>"));
        Assert.That(body, Does.Contain("<changefreq>weekly</changefreq>"));
        Assert.That(body, Does.Contain("<priority>1.0</priority>"));
    }
}
