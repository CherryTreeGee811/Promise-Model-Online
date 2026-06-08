using System.Net;

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
        Assert.That(sessionCookie.SameSite, Is.EqualTo("Lax"));
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

        await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", "pmo_test");
        await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", "wrong-password");

        await Page.ClickAsync("button[type=\"submit\"]");

        var body = await Page.TextContentAsync("body") ?? "";
        Assert.That(body, Does.Contain("Invalid").Or.Contains("invalid").Or.Contains("try again"),
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
        // With valid session, the BFF should attempt to proxy to API
        // (which returns 502 since the API address in test is the internal Docker hostname)
        await LoginAsync();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/projects");
        // Playwright cookies are automatically included via context
        var response = await Client.SendAsync(request);

        // Either a real response from the API or a proxy error is expected
        Assert.That(response.StatusCode, Is.AnyOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadGateway,
            HttpStatusCode.ServiceUnavailable),
            "Authenticated API requests should reach the backend or fail with proxy error");
    }
}
