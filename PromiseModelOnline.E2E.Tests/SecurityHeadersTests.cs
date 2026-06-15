using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for security headers (CSP, manifest, service worker, robots, sitemap) on all responses.</summary>
// Requirements: REQ_NF_005 REQ_PWA_001 REQ_PWA_004 REQ_PWA_005
public class SecurityHeadersTests : E2ETestBase
{
    [Test]
    public async Task REQ_NF_005_SPA_ReturnsCspHeader()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/");
        // Assert
        Assert.That(response.Headers.Contains("Content-Security-Policy"), Is.True,
            "CSP header should be present on SPA responses");
    }

    [Test]
    public async Task REQ_NF_005_SPA_CspRestrictsScriptSources()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/");
        var csp = response.Headers.GetValues("Content-Security-Policy").FirstOrDefault();
        // Assert
        Assert.That(csp, Does.Contain("default-src 'none'"), "CSP should set default-src 'none'");
        Assert.That(csp, Does.Contain("script-src 'self'"), "CSP should restrict script-src");
    }

    [Test]
    public async Task REQ_NF_005_Login_ReturnsRedirect()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_005_ApiRequest_Ajax_Returns401_WhenUnauthenticated()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/api/projects", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_NF_005_HubsRequest_Ajax_Returns401_WhenUnauthenticated()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/hubs/notifications", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_NF_005_UnknownRoute_ReturnsSPAIndex()
    {
        // SPA router handles client-side failures; nginx serves index.html
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/nonexistent");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_PWA_004: CSP allows manifest-src 'self'")]
    public async Task REQ_NF_005_CSP_IncludesManifestSrc()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/");
        var csp = response.Headers.GetValues("Content-Security-Policy").FirstOrDefault();
        // Assert
        Assert.That(csp, Does.Contain("manifest-src 'self'"), "CSP should allow manifest-src 'self'");
    }

    [Test]
    [Description("REQ_PWA_004: Manifest JSON served with correct content type")]
    public async Task REQ_NF_005_ManifestJson_ServedCorrectly()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/manifest.json");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/json"));
    }

    [Test]
    [Description("REQ_PWA_001: Service worker served with correct content type")]
    public async Task REQ_NF_005_ServiceWorker_ServedCorrectly()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/sw.mjs");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.That(contentType, Is.EqualTo("application/javascript").Or.EqualTo("text/javascript"));
    }

    [Test]
    [Description("REQ_PWA_004: SPA HTML includes manifest link")]
    public async Task REQ_NF_005_SPA_IncludesManifestLink()
    {
        // Arrange (no setup needed)
        // Act
        var html = await Client.GetStringAsync("/");
        // Assert
        Assert.That(html, Does.Contain("rel=\"manifest\" href=\"/manifest.json\""));
    }

    [Test]
    public async Task REQ_NF_005_RobotsTxt_ServedCorrectly()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/robots.txt");
        // Assert
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
    public async Task REQ_NF_005_SitemapXml_ServedCorrectly()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/sitemap.xml");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/xml"));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("<loc>https://localhost/</loc>"));
        Assert.That(body, Does.Contain("<changefreq>weekly</changefreq>"));
        Assert.That(body, Does.Contain("<priority>1.0</priority>"));
    }
}
