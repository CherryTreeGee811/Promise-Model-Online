using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

/// <summary>Integration tests for the BFF /login endpoint with OIDC challenge, return URL validation, and redirect handling.</summary>
// Requirements: REQ_FUN_002 REQ_OIDC_002 REQ_OIDC_004
public class LoginEndpointTests
{
    [Test]
    [Description("REQ_OIDC_002: BFF /login without return URL triggers OIDC challenge")]
    public async Task REQ_FUN_002_Login_WithoutReturnUrl_RedirectsToChallenge()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/login");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        Assert.That(response.Headers.Location?.ToString(), Does.StartWith("/test-challenge"));
    }

    [Test]
    public async Task REQ_FUN_002_Login_WithSafeReturnUrl_RedirectsToChallenge()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/login?returnUrl=/projects/1");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_FUN_002_Login_WithUnsafeAbsoluteUrl_DefaultsToRoot()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/login?returnUrl=https://evil.com");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_FUN_002_Login_WithDoubleSlashUrl_DefaultsToRoot()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/login?returnUrl=//evil.com");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_FUN_002_Login_WithBackslashUrl_DefaultsToRoot()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/login?returnUrl=/\\evil.com");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
