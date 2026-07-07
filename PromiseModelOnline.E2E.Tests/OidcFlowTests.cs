using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for the complete OIDC flow via the browser: login, session cookie, logout, and error handling.</summary>
// Requirements: REQ_INT_015 REQ_OAUTH_001 REQ_OAUTH_008 REQ_OIDC_001 REQ_OIDC_002 REQ_OIDC_004 REQ_OIDC_006
public class OidcFlowTests : E2ETestBase
{
    [Test]
    [Description("REQ_OIDC_001: Complete OIDC flow from scratch — navigate to BFF /login, authenticate on Auth server, verify session cookie")]
    public async Task REQ_OIDC_001_FullLoginFlow_FromScratch()
    {
        // Arrange — no pre-authentication, no pre-set cookies, no dev unlock
        // Navigate to BFF /login to trigger the full OIDC challenge redirect chain
        await NavigateForLoginAsync("/projects");

        // Act — authenticate on the Auth server login page
        await Page.Locator("#Username").FillAsync(TestUsername);
        await Page.Locator("#Password").FillAsync(TestPassword);

        // Submit triggers: Auth server validates → sets __Host-pmo.auth
        //   → redirects to /connect/authorize (auto-authorizes, implicit consent)
        //   → issues auth code → redirects to /signin-oidc
        //   → BFF exchanges code → sets __Host-pmo.session → redirects to /projects
        await Page.ClickAsync("button[type=\"submit\"]");
        await Page.WaitForURLAsync("**/projects**", new() { Timeout = 20000 });

        // Assert — verify both cookies with correct security properties
        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(sessionCookie, Is.Not.Null, "BFF session cookie must be set after OIDC flow");
        Assert.That(sessionCookie!.HttpOnly, Is.True, "Session cookie must be HttpOnly");
        Assert.That(sessionCookie.Secure, Is.True, "Session cookie must be Secure");
        Assert.That(sessionCookie.SameSite, Is.EqualTo(SameSiteAttribute.Lax), "Session cookie must be SameSite=Lax");
        Assert.That(sessionCookie.Path, Is.EqualTo("/"), "Session cookie path must be / for __Host- compliance");

        var authCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.auth");
        Assert.That(authCookie, Is.Not.Null, "Auth server cookie must be set after login");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_OIDC_006: Register new user, verify email, then complete full OIDC login flow")]
    public async Task REQ_OIDC_006_RegisterAndCompleteOidcFlow()
    {
        // Arrange — register and verify a new user through the proper form
        var suffix = Guid.NewGuid().ToString("N");
        var username = $"e2e_oidc_{suffix}";
        var email = $"e2e_oidc_{suffix}@example.com";

        await NavigateForFormAsync("/account/register");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await Page.FillAsync("#Username", username);
        await Page.FillAsync("#Email", email);
        await Page.FillAsync("#Password", TestPassword);
        await Page.FillAsync("#ConfirmPassword", TestPassword);
        await Page.CheckAsync("#privacyConsent");

        await SubmitFormAsync();
        await Page.WaitForURLAsync(new Regex("account/verify-email\\?userId="), new() { Timeout = 5000 });

        var match = Regex.Match(Page.Url, @"userId=([^&]+)");
        Assert.That(match.Success, Is.True);
        var userId = match.Groups[1].Value;

        var codeResponse = await GetAsync($"/account/verify-email/debug/code/{userId}");
        var json = System.Text.Json.JsonDocument.Parse(await codeResponse.Content.ReadAsStringAsync());
        var code = json.RootElement.GetProperty("code").GetString()!;

        // Sync cookies after redirect to verify-email page, then submit verification
        await _context.CookiesAsync();
        await Page.FillAsync("#Code", code);
        await SubmitFormAsync(".verify-code-form");
        await Page.WaitForURLAsync(new Regex("account/login"), new() { Timeout = 15000 });

        // Act — full OIDC flow from scratch using NavigateForLoginAsync for anti-CSRF sync
        await NavigateForLoginAsync("/projects");

        await Page.Locator("#Username").FillAsync(username);
        await Page.Locator("#Password").FillAsync(TestPassword);

        await Page.ClickAsync("button[type=\"submit\"]");
        await Page.WaitForURLAsync("**/projects**", new() { Timeout = 15000 });

        // Assert — verify the registered user got a full OIDC session
        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(sessionCookie, Is.Not.Null, "Newly registered user must get BFF session cookie");
        Assert.That(sessionCookie!.HttpOnly, Is.True);
        Assert.That(sessionCookie.Secure, Is.True);

        // Verify the cookie works for an authenticated API call
        using var client = await GetAuthClientAsync();
        var response = await client.GetAsync("/api/projects");
        Assert.That(response.StatusCode, Is.AnyOf(
            HttpStatusCode.OK, HttpStatusCode.BadGateway, HttpStatusCode.ServiceUnavailable),
            "Registered user should reach the API or get a proxy error");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_OIDC_002: OIDC login sets session cookie with HttpOnly, Secure, SameSite=Lax")]
    public async Task REQ_INT_015_Login_ValidCredentials_SetsSessionCookie()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c =>
            c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(sessionCookie, Is.Not.Null, "Session cookie should be set after login");
        Assert.That(sessionCookie!.HttpOnly, Is.True, "Session cookie should be HttpOnly");
        Assert.That(sessionCookie.Secure, Is.True, "Session cookie should be Secure");
        Assert.That(sessionCookie.SameSite, Is.EqualTo(SameSiteAttribute.Lax));
    }

    [Test]
    [Description("REQ_OIDC_004: End-session logout clears session cookie")]
    public async Task REQ_INT_015_Login_ThenLogout_ClearsSessionCookie()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
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
        // Use a non-existent username so no real account's lockout counter is affected
        await NavigateForLoginAsync("/");

        await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", "nonexistent_user");
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
        await LoginAsUser(TestUsername, TestPassword);
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
