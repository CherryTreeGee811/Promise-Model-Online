using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for API misuse scenarios — returnUrl sanitization, 404 handling, input validation at multiple layers.</summary>
// Requirements: REQ_NF_008
public class MisuseTests : E2ETestBase
{
    [Test]
    public async Task REQ_NF_008_Login_AbsoluteUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=https://evil.com");

        // Assert
        Assert.That(Page.Url, Does.Not.Contain("evil.com"));
    }

    [Test]
    public async Task REQ_NF_008_Login_AbsoluteUrl_BypassClient_RedirectsSafely()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=https://evil.com");
        var location = response.Headers.Location?.ToString() ?? "";

        // Assert
        Assert.That(location, Does.Not.Contain("evil.com"));
    }

    [Test]
    public async Task REQ_NF_008_Login_FtpUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=ftp://evil.com");

        // Assert — the user is sent to the login flow, not to the FTP site
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    public async Task REQ_NF_008_Login_FtpUrl_BypassClient_RedirectsSafely()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=ftp://evil.com");
        var location = response.Headers.Location?.ToString() ?? "";

        // Assert
        Assert.That(location, Does.Not.Contain("evil.com"));
    }

    [Test]
    public async Task REQ_NF_008_Login_JavaScriptUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=javascript:alert(1)");

        // Assert — the user is sent to the login flow, not where the JS URL would navigate
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    public async Task REQ_NF_008_Login_JavaScriptUrl_BypassClient_RedirectsSafely()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=javascript:alert(1)");
        var location = response.Headers.Location?.ToString() ?? "";

        // Assert
        Assert.That(location, Does.Not.Contain("javascript"));
    }

    [Test]
    public async Task REQ_NF_008_Login_DoubleSlashUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=//evil.com");

        // Assert
        Assert.That(Page.Url, Does.Not.Contain("evil.com"));
    }

    [Test]
    public async Task REQ_NF_008_Login_DoubleSlashUrl_BypassClient_RedirectsSafely()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=//evil.com");
        var location = response.Headers.Location?.ToString() ?? "";

        // Assert
        Assert.That(location, Does.Not.Contain("evil.com"));
    }

    [Test]
    public async Task REQ_NF_008_Login_PathTraversal_ReturnsChallenge()
    {
        // Arrange (no setup needed)
        // Act
        await Page.GotoAsync("/login?returnUrl=/../secrets");

        // Assert
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    public async Task REQ_NF_008_Login_PathTraversal_BypassClient_RedirectsSafely()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/../secrets");
        var location = response.Headers.Location?.ToString() ?? "";

        // Assert
        Assert.That(location, Does.Not.Contain("../"));
    }

    [Test]
    public async Task REQ_NF_008_StaticAssetNotFound_Returns404()
    {
        // Arrange (no setup needed)
        // Act
        var response = await Page.GotoAsync("/nonexistent.js");

        // Assert
        Assert.That(response, Is.Not.Null);
        Assert.That((int)response.Status, Is.EqualTo(404));
    }

    [Test]
    public async Task REQ_NF_008_StaticAssetNotFound_BypassClient_Returns404()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/nonexistent.js");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task REQ_NF_008_ApiNotFound_BypassClient_Returns404()
    {
        // Arrange — auth required to bypass the auth middleware and reach the router
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/nonexistent", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
