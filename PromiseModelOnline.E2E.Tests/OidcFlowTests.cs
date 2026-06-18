using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for the complete OIDC flow via the browser: login, session cookie, logout, and error handling.</summary>
// Requirements: REQ_INT_015 REQ_OAUTH_001 REQ_OAUTH_008 REQ_OIDC_001 REQ_OIDC_002 REQ_OIDC_004 REQ_OIDC_006
public class OidcFlowTests : E2ETestBase
{
    [Test]
    [Description("REQ_OIDC_002: OIDC login sets session cookie with HttpOnly, Secure, SameSite=Lax")]
    public async Task REQ_INT_015_Login_ValidCredentials_SetsSessionCookie()
    {
        // Arrange
        await LoginAsync();
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c =>
            c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(sessionCookie, Is.Not.Null, "Session cookie should be set after login");
        Assert.That(sessionCookie!.HttpOnly, Is.True, "Session cookie should be HttpOnly");
        Assert.That(sessionCookie.Secure, Is.True, "Session cookie should be Secure");
        Assert.That(sessionCookie.SameSite, Is.EqualTo(Microsoft.Playwright.SameSiteAttribute.Lax));
    }

    [Test]
    [Description("REQ_OIDC_004: End-session logout clears session cookie")]
    public async Task REQ_INT_015_Login_ThenLogout_ClearsSessionCookie()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync("/logout");

        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(sessionCookie, Is.Null, "Session cookie should be cleared after logout");
    }

    [Test]
    public async Task REQ_INT_015_Login_InvalidCredentials_ShowsError()
    {
        // Arrange
        await Page.GotoAsync("/login?returnUrl=/", new() { Timeout = 5000 });
        await Page.WaitForURLAsync("**/account/login**", new() { Timeout = 5000 });

        await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", TestUsername);
        await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", "wrong");
        // Act
        await Page.ClickAsync("button[type=\"submit\"]");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle, new() { Timeout = 10000 });

        var body = await Page.TextContentAsync("body") ?? "";
        // Assert
        Assert.That(body, Does.Contain("Invalid").Or.Contains("invalid"),
            "Error message should be shown for invalid credentials");
    }

    [Test]
    public async Task REQ_INT_015_Logout_ReturnsRedirect()
    {
        // Act & Assert
        var response = await GetAsync("/logout");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_INT_015_AuthenticatedRequest_ToApi_ReturnsBadGateway()
    {
        // Arrange
        await LoginAsync();
        // Act
        using var client = await GetAuthClientAsync();
        var response = await client.GetAsync("/api/projects");
        // Assert
        Assert.That(response.StatusCode, Is.AnyOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadGateway,
            HttpStatusCode.ServiceUnavailable),
            "Authenticated API requests should reach the backend or fail with proxy error");
    }
}
