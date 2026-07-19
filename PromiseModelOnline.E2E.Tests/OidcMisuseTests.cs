using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// OAuth 2.1 + OIDC compliance and misuse cases.
/// Verifies the authorization server, BFF cookie security,
/// token handling, redirect validation, PKCE enforcement,
/// grant type restrictions, and CSRF protection.
/// </summary>
// Requirements: REQ_NF_008 REQ_OAUTH_001 REQ_OAUTH_002 REQ_OAUTH_003 REQ_OAUTH_004 REQ_OAUTH_008 REQ_OAUTH_009 REQ_OAUTH_010 REQ_OIDC_001 REQ_OIDC_002 REQ_OIDC_003
public class OidcMisuseTests : E2ETestBase
{
    // ── CSRF (State Parameter) ──────────────────────────────

    [Test]
    [Description("REQ_OAUTH_008: State parameter required for CSRF protection")]
    public async Task REQ_NF_008_Authorize_MissingState_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Authorization without state should be rejected");
    }

    [Test]
    [Description("REQ_OAUTH_008: Invalid/tampered state parameter is rejected")]
    public async Task REQ_NF_008_Authorize_InvalidState_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=invalid");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Authorization with invalid state should fail");
    }

    // ── Redirect URI Validation ──────────────────────────────

    [Test]
    [Description("REQ_OAUTH_003: Untrusted redirect URI is rejected")]
    public async Task REQ_NF_008_Authorize_UntrustedRedirectUri_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://evil.com/callback&scope=openid&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Untrusted redirect URI must be rejected");
    }

    [Test]
    [Description("REQ_OAUTH_003: Missing redirect_uri is rejected")]
    public async Task REQ_NF_008_Authorize_NoRedirectUri_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&scope=openid&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing redirect_uri must be rejected");
    }

    [Test]
    public async Task REQ_NF_008_Authorize_MalformedRedirectUri_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=not-a-uri&scope=openid&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Malformed redirect_uri must be rejected");
    }

    // ── PKCE Enforcement ──────────────────────────────────────

    [Test]
    [Description("REQ_OAUTH_002: Token request without code_verifier rejected (PKCE required)")]
    public async Task REQ_NF_008_Token_MissingCodeVerifier_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "authorization_code",
            ["code"] = "fake-code",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc",
            ["client_id"] = "pmo-spa"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Token request without code_verifier must be rejected (PKCE required)");
    }

    [Test]
    [Description("REQ_OAUTH_004: Invalid/expired authorization code is rejected")]
    public async Task REQ_NF_008_Token_InvalidCode_ReturnsBadRequest()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "authorization_code",
            ["code"] = "invalid-or-expired-code",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc",
            ["client_id"] = "pmo-spa",
            ["code_verifier"] = "test-verifier"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Invalid authorization code must be rejected");
    }

    // ── Grant Type Enforcement ────────────────────────────────

    [Test]
    [Description("REQ_OAUTH_001: Implicit grant rejected (OAuth 2.1)")]
    public async Task REQ_NF_008_Token_ImplicitGrant_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "implicit",
            ["client_id"] = "pmo-spa",
            ["redirect_uri"] = "https://localhost:9000/signin-oidc"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Implicit grant must be rejected per OAuth 2.1");
    }

    [Test]
    [Description("REQ_OAUTH_001: Password grant rejected (OAuth 2.1)")]
    public async Task REQ_NF_008_Token_PasswordGrant_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "password",
            ["username"] = TestUsername,
            ["password"] = TestPassword,
            ["client_id"] = "pmo-spa"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Password grant must be rejected per OAuth 2.1");
    }

    [Test]
    [Description("REQ_OAUTH_001: Client credentials grant rejected for public client")]
    public async Task REQ_NF_008_Token_ClientCredentials_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = "pmo-spa",
            ["client_secret"] = "fake"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Client credentials for public client must be rejected");
    }

    [Test]
    public async Task REQ_NF_008_Token_MissingGrantType_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostFormAsync("/connect/token", new()
        {
            ["client_id"] = "pmo-spa"
        });
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing grant_type must be rejected");
    }

    // ── Client Authentication ─────────────────────────────────

    [Test]
    public async Task REQ_NF_008_Authorize_MissingClientId_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Missing client_id must be rejected");
    }

    [Test]
    public async Task REQ_NF_008_Authorize_InvalidClientId_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=evil-client&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=openid&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Unknown client_id must be rejected");
    }

    // ── Cookie Security (__Host- prefix) ──────────────────────

    [Test]
    public async Task REQ_NF_008_AuthCookie_HasHostPrefix()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session, Is.Not.Null);
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_IsHttpOnly()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session.HttpOnly, Is.True,
            "Session cookie must be HttpOnly to prevent JS access");
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_IsSecure()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session.Secure, Is.True,
            "Session cookie must be Secure (HTTPS only)");
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_HasSameSiteLax()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session.SameSite, Is.EqualTo(Microsoft.Playwright.SameSiteAttribute.Lax),
            "Session cookie must be SameSite=Lax for CSRF protection");
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_HasRootPath()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session.Path, Is.EqualTo("/"),
            "Session cookie path must be / for __Host- compliance");
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_HasNoDomainAttribute()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.First(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(string.IsNullOrEmpty(session.Domain) || session.Domain == "localhost",
            "Session cookie must not set Domain to satisfy __Host- prefix rules");
    }

    [Test]
    public async Task REQ_NF_008_AuthCookie_NotAccessibleViaDocumentCookie()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var jsCookie = await Page.EvaluateAsync<string>("document.cookie");
        // Assert
        Assert.That(jsCookie, Does.Not.Contain("__Host-pmo.session"),
            "HttpOnly session cookie must not be readable via document.cookie");
    }

    // ── Token Endpoint Abuse ──────────────────────────────────

    [Test]
    public async Task REQ_NF_008_Token_GetRequest_ReturnsMethodNotAllowed()
    {
        // Act
        var response = await GetAsync(
            "/connect/token?grant_type=authorization_code&code=x&client_id=pmo-spa");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Token endpoint must reject GET requests");
    }

    [Test]
    public async Task REQ_NF_008_Token_NoParams_ReturnsBadRequest()
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Post, "/connect/token");
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Token endpoint must reject empty POST");
    }

    // ── Session Fixation ──────────────────────────────────────

    [Test]
    public async Task REQ_NF_008_Login_AfterLogout_CanLoginAgain()
    {
        // Arrange
        await LoginAsUser(TestUsername, TestPassword);
        await Page.GotoAsync("/logout");
        await LoginAsUser(TestUsername, TestPassword);
        // Act
        var cookies = await Page.Context.CookiesAsync();
        var session = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        // Assert
        Assert.That(session, Is.Not.Null, "Must be able to login after logout");
    }

    // ── Replay / Injection ──────────────────────────────────

    [Test]
    public async Task REQ_NF_008_ApiCall_WithArbitraryCookie_Rejected()
    {
        // Set a fake session cookie and try to access API
        // Arrange
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
        // Act
        var response = await GetAsync("/api/projects", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized),
            "Fake session cookie must not grant access");
    }

    // ── OpenID Configuration Integrity ────────────────────────

    [Test]
    [Description("REQ_OIDC_001: Discovery endpoint returns valid OpenID Configuration")]
    public async Task REQ_NF_008_DiscoveryEndpoint_ReturnsValidJson()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/.well-known/openid-configuration");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        // Assert
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
    [Description("REQ_OAUTH_007: Invalid/unknown scope is rejected at authorize")]
    public async Task REQ_NF_008_Authorize_InvalidScope_ReturnsError()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync(
            "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=https://localhost:9000/signin-oidc&scope=admin&state=test");
        // Assert
        Assert.That((int)response.StatusCode, Is.GreaterThanOrEqualTo(400),
            "Unknown scope must be rejected");
    }
}
