using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

public class OidcFlowTests : E2ETestBase
{
    [Test]
    public async Task Login_ValidCredentials_SetsSessionCookie()
    {
        await LoginAsync();

        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c =>
            c.Name == "__Host-pmo.session");

        Assert.That(sessionCookie, Is.Not.Null, "Session cookie should be set after login");
        Assert.That(sessionCookie!.HttpOnly, Is.True, "Session cookie should be HttpOnly");
        Assert.That(sessionCookie.Secure, Is.True, "Session cookie should be Secure");
        Assert.That(sessionCookie.SameSite, Is.EqualTo(Microsoft.Playwright.SameSiteAttribute.Lax));
    }

    [Test]
    public async Task Login_ThenLogout_ClearsSessionCookie()
    {
        await LoginAsync();

        await Page.GotoAsync("/logout");

        var cookies = await Page.Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(sessionCookie, Is.Null, "Session cookie should be cleared after logout");
    }

    [Test]
    public async Task Login_InvalidCredentials_ShowsError()
    {
        await Page.GotoAsync("/login?returnUrl=/");
        await Page.WaitForURLAsync("**/account/login**");

        await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", TestUsername);
        await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", "wrong");

        await Page.ClickAsync("button[type=\"submit\"]");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var body = await Page.TextContentAsync("body") ?? "";
        Assert.That(body, Does.Contain("Invalid").Or.Contains("invalid"),
            "Error message should be shown for invalid credentials");
    }

    [Test]
    public async Task Logout_ReturnsRedirect()
    {
        var response = await GetAsync("/logout");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task AuthenticatedRequest_ToApi_ReturnsBadGateway()
    {
        await LoginAsync();

        using var client = await GetAuthClientAsync();
        var response = await client.GetAsync("/api/projects");

        Assert.That(response.StatusCode, Is.AnyOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadGateway,
            HttpStatusCode.ServiceUnavailable),
            "Authenticated API requests should reach the backend or fail with proxy error");
    }
}
