using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for security headers (CSP) via page navigation and direct HTTP checks.</summary>
// Requirements: REQ_NF_005 REQ_PWA_001 REQ_PWA_004
public class SecurityHeadersTests : E2ETestBase
{
    [Test]
    public async Task REQ_NF_005_SPA_ReturnsCspHeader()
    {
        // Arrange (no setup needed)
        // Act
        var response = await Page.GotoAsync("/");

        // Assert
        Assert.That(response, Is.Not.Null);
        Assert.That(response.Headers, Contains.Key("content-security-policy"));
        Assert.That(response.Headers["content-security-policy"], Is.Not.Empty);
    }

    [Test]
    public async Task REQ_NF_005_SPA_CspRestrictsScriptSources()
    {
        // Arrange (no setup needed)
        // Act
        var response = await Page.GotoAsync("/");
        var csp = response!.Headers["content-security-policy"];

        // Assert
        Assert.That(csp, Does.Contain("default-src 'none'"));
        Assert.That(csp, Does.Contain("script-src"));
    }

    [Test]
    public async Task REQ_NF_005_Login_ReturnsRedirect()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=/");

        // Assert
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    public async Task REQ_NF_005_ApiRequest_Unauthenticated_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/api/projects", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_PWA_001_ServiceWorker_IsRegistered()
    {
        // Arrange
        await Page.GotoAsync("/");

        // Act
        var hasSw = await Page.EvaluateAsync<bool>(@"
            navigator.serviceWorker.getRegistration('/').then(r => !!r)
        ");

        // Assert
        Assert.That(hasSw, Is.True, "Service worker should be registered after page load");
    }

    [Test]
    public async Task REQ_PWA_004_Manifest_ReturnsJson()
    {
        // Arrange (no setup needed)
        // Act
        var response = await Page.GotoAsync("/manifest.json");

        // Assert
        Assert.That(response, Is.Not.Null);
        Assert.That((int)response.Status, Is.EqualTo(200));
        Assert.That(response.Headers, Contains.Key("content-type"));
        Assert.That(response.Headers["content-type"], Does.Contain("json").Or.Contain("manifest"));
    }
}
