using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// OAuth 2.1 + OIDC compliance and misuse cases.
/// Verifies the authorization server, BFF cookie security,
/// token handling, redirect validation, and CSRF protection.
/// </summary>
public class OidcMisuseTests : E2ETestBase
{
    // ── CSRF (State Parameter) ──────────────────────────────

    [Test]
    public async Task Authorize_MissingState_ReturnsError()
    {
        // OAuth 2.1 REQUIRES state for CSRF protection
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Authorization without state should be rejected");
    }

    [Test]
    public async Task Authorize_InvalidState_ReturnsError()
    {
        // Tampered state should not cause redirect to malicious URI
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=invalid");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Authorization with invalid state should fail");
    }

    // ── Redirect URI Validation ──────────────────────────────

    [Test]
    public async Task Authorize_UntrustedRedirectUri_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://evil.com/callback&scope=openid&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Untrusted redirect URI must be rejected");
    }

    [Test]
    public async Task Authorize_NoRedirectUri_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&scope=openid&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing redirect_uri must be rejected");
    }

    [Test]
    public async Task Authorize_MalformedRedirectUri_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=not-a-uri&scope=openid&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Malformed redirect_uri must be rejected");
    }

    // ── PKCE Enforcement ──────────────────────────────────────

    [Test]
    public async Task Token_MissingCodeVerifier_ReturnsError()
    {
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "authorization_code",
            ["code"] = "fake-code",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc",
            ["client_id"] = "pmo-spa"
        });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Token request without code_verifier must be rejected (PKCE required)");
    }

    [Test]
    public async Task Token_InvalidCode_ReturnsBadRequest()
    {
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "authorization_code",
            ["code"] = "invalid-or-expired-code",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc",
            ["client_id"] = "pmo-spa",
            ["code_verifier"] = "test-verifier"
        });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Invalid authorization code must be rejected");
    }

    // ── Grant Type Enforcement ────────────────────────────────

    [Test]
    public async Task Token_ImplicitGrant_ReturnsError()
    {
        // OAuth 2.1 forbids implicit grant
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "implicit",
            ["client_id"] = "pmo-spa",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc"
        });
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Implicit grant must be rejected per OAuth 2.1");
    }

    [Test]
    public async Task Token_PasswordGrant_ReturnsError()
    {
        // OAuth 2.1 removes password grant
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "password",
            ["username"] = TestUsername,
            ["password"] = TestPassword,
            ["client_id"] = "pmo-spa"
        });
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Password grant must be rejected per OAuth 2.1");
    }

    [Test]
    public async Task Token_ClientCredentials_ReturnsError()
    {
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = "pmo-spa",
            ["client_secret"] = "fake"
        });
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Client credentials for public client must be rejected");
    }

    [Test]
    public async Task Token_MissingGrantType_ReturnsError()
    {
        var response = await PostFormAsync("/connect/token", new()
        {
            ["client_id"] = "pmo-spa"
        });
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing grant_type must be rejected");
    }

    // ── Client Authentication ─────────────────────────────────

    [Test]
    public async Task Authorize_MissingClientId_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing client_id must be rejected");
    }

    [Test]
    public async Task Authorize_InvalidClientId_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?client_id=evil-client&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Unknown client_id must be rejected");
    }

    // ── Cookie Security (__Host- prefix) ──────────────────────

    [Test]
    public async Task AuthCookie_HasHostPrefix()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(session, Is.Not.Null);
    }

    [Test]
    public async Task AuthCookie_IsHttpOnly()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        Assert.That(session.HttpOnly, Is.True,
            "Session cookie must be HttpOnly to prevent JS access");
    }

    [Test]
    public async Task AuthCookie_IsSecure()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        Assert.That(session.Secure, Is.True,
            "Session cookie must be Secure (HTTPS only)");
    }

    [Test]
    public async Task AuthCookie_HasSameSiteLax()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        Assert.That(session.SameSite, Is.EqualTo("Lax"),
            "Session cookie must be SameSite=Lax for CSRF protection");
    }

    [Test]
    public async Task AuthCookie_HasRootPath()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        Assert.That(session.Path, Is.EqualTo("/"),
            "Session cookie path must be / for __Host- compliance");
    }

    [Test]
    public async Task AuthCookie_HasNoDomainAttribute()
    {
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        Assert.That(string.IsNullOrEmpty(session.Domain) || session.Domain == "localhost",
            "Session cookie must not set Domain to satisfy __Host- prefix rules");
    }

    [Test]
    public async Task AuthCookie_NotAccessibleViaDocumentCookie()
    {
        await LoginAsync();
        var jsCookie = await Page.EvaluateAsync<string>("document.cookie");
        Assert.That(jsCookie, Does.Not.Contain("__Host-pmo.session"),
            "HttpOnly session cookie must not be readable via document.cookie");
    }

    // ── Token Endpoint Abuse ──────────────────────────────────

    [Test]
    public async Task Token_GetRequest_ReturnsMethodNotAllowed()
    {
        var response = await GetAsync(
            "/connect/token?grant_type=authorization_code&code=x&client_id=pmo-spa");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed),
            "Token endpoint must reject GET requests");
    }

    [Test]
    public async Task Token_NoParams_ReturnsBadRequest()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/connect/token");
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Token endpoint must reject empty POST");
    }

    // ── Session Fixation ──────────────────────────────────────

    [Test]
    public async Task Login_AfterLogout_CanLoginAgain()
    {
        await LoginAsync();
        await Page.GotoAsync("/logout");
        await LoginAsync();
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(session, Is.Not.Null, "Must be able to login after logout");
    }

    // ── Replay / Injection ──────────────────────────────────

    [Test]
    public async Task ApiCall_WithArbitraryCookie_Rejected()
    {
        // Set a fake session cookie and try to access API
        await Page.Context.AddCookiesAsync(new[]
        {
            new Microsoft.Playwright.Cookie
            {
                Name = "__Host-pmo.session",
                Value = "fake-session-value",
                Url = "https://localhost:9000",
                Secure = true,
                HttpOnly = true
            }
        });
        var response = await GetAsync("/api/projects", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized),
            "Fake session cookie must not grant access");
    }

    // ── OpenID Configuration Integrity ────────────────────────

    [Test]
    public async Task DiscoveryEndpoint_ReturnsValidJson()
    {
        var response = await GetAsync("/.well-known/openid-configuration");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("issuer"), "Discovery must include issuer");
        Assert.That(body, Does.Contain("authorization_endpoint"),
            "Discovery must include authorization_endpoint");
        Assert.That(body, Does.Contain("token_endpoint"),
            "Discovery must include token_endpoint");
        Assert.That(body, Does.Contain("response_types_supported"),
            "Discovery must include response_types_supported");
    }

    // ── Scope Validation ──────────────────────────────────────

    [Test]
    public async Task Authorize_InvalidScope_ReturnsError()
    {
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=admin&state=test");
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Unknown scope must be rejected");
    }
}
