using Microsoft.Playwright;
using System.Text.Json.Nodes;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for OIDC authentication, OAuth 2.1 compliance, discovery document, and token handling.</summary>
// Requirements: REQ_INT_015 REQ_INT_016 REQ_OAUTH_001 REQ_OAUTH_002 REQ_OAUTH_003 REQ_OAUTH_004 REQ_OAUTH_008 REQ_OIDC_001 REQ_OIDC_002 REQ_OIDC_003 REQ_OIDC_004 REQ_OIDC_005 REQ_OIDC_006 REQ_OIDC_007
public class OidcAuthTests : PlaywrightTestBase
{
    [Test]
    [Description("REQ-OIDC-01: OpenID Connect Discovery document")]
    public async Task REQ_INT_015_WellKnownOpenIdConfiguration_ReturnsValidDiscoveryDocument()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(d => JSON.stringify(d))");

        var doc = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(doc["issuer"]!.GetValue<string>(), Does.Contain("localhost"));
        Assert.That(doc["authorization_endpoint"]!.GetValue<string>(), Does.Contain("/connect/authorize"));
        Assert.That(doc["token_endpoint"]!.GetValue<string>(), Does.Contain("/connect/token"));
        Assert.That(doc["end_session_endpoint"]!.GetValue<string>(), Does.Contain("/connect/logout"));
        Assert.That(doc["jwks_uri"]!.GetValue<string>(), Does.Contain("/.well-known/jwks"));

        var scopes = doc["scopes_supported"]!.AsArray()
            .Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(scopes, Does.Contain("openid"));
        Assert.That(scopes, Does.Contain("offline_access"));

        var grantTypes = doc["grant_types_supported"]!.AsArray()
            .Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(grantTypes, Does.Contain("authorization_code"));
        Assert.That(grantTypes, Does.Not.Contain("implicit"));
        Assert.That(grantTypes, Does.Not.Contain("password"));
        Assert.That(grantTypes, Does.Not.Contain("client_credentials"));

        var pkceMethods = doc["code_challenge_methods_supported"]!.AsArray()
            .Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(pkceMethods, Does.Contain("S256"));

        Assert.That(doc["require_pkce"]!.GetValue<bool>(), Is.True);
    }

    [Test]
    [Description("REQ-OIDC-02: Authorization endpoint redirects to login")]
    public async Task REQ_INT_015_AuthorizeEndpoint_RedirectsToLoginPage()
    {
        await Page.GotoAsync(BaseUrl + "/connect/authorize", new PageGotoOptions { Timeout = 2000, WaitUntil = WaitUntilState.DOMContentLoaded });
        Assert.That(await WaitUntilAsync(() => Task.FromResult(Page.Url.Contains("/account/login")), 2), Is.True,
            "Should redirect to login page");
    }

    [Test]
    [Description("REQ-OIDC-03: End Session endpoint redirects to post-logout URI")]
    public async Task REQ_INT_015_EndSessionEndpoint_RedirectsToPostLogoutUri()
    {
        await Page.GotoAsync(BaseUrl + "/connect/logout", new PageGotoOptions { Timeout = 2000, WaitUntil = WaitUntilState.DOMContentLoaded });
        Assert.That(await WaitUntilAsync(() => Task.FromResult(new Uri(Page.Url).AbsolutePath == "/"), 2), Is.True,
            "Should redirect to root");
    }

    [Test]
    [Description("REQ-OIDC-04: OIDC callback paths return SPA shell")]
    public async Task REQ_INT_015_OidcCallbackPaths_ReturnSpaShell()
    {
        foreach (var path in new[] { "/signin-oidc", "/signout-callback-oidc" })
        {
            // Act & Assert
            await Page.GotoAsync(BaseUrl + path, new PageGotoOptions { Timeout = 2000, WaitUntil = WaitUntilState.DOMContentLoaded });
            Assert.That(Page.Url, Does.Contain(path), $"{path} should load the callback page");
            // Reset to root between iterations to avoid SPA router conflicts
            await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });
        }
    }

    [Test]
    [Description("REQ-OIDC-05: BFF login endpoint triggers OIDC challenge")]
    public async Task REQ_INT_015_LoginEndpoint_ReturnsSpaShell()
    {
        // Act & Assert
        await Page.GotoAsync(BaseUrl + "/login", new PageGotoOptions { Timeout = 2000 });
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    [Description("REQ-OIDC-06: SPA login link navigates to BFF /login")]
    public async Task REQ_INT_015_LoginLink_InAnonymousPage_PointsToBffLogin()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var link = await WaitForSelectorAsync("#login-link");
        var href = await link.GetAttributeAsync("href");

        // Assert
        Assert.That(href, Does.Contain("/login"));
    }

    [Test]
    [Description("REQ-OIDC-07: BFF logout endpoint triggers session termination")]
    public async Task REQ_INT_015_LogoutLink_WhenAuthenticated_PointsToBffLogout()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        await Page.Locator("#user-dropdown").ClickAsync();
        var link = await WaitForSelectorAsync("#logout-link");
        var href = await link.GetAttributeAsync("href");

        // Assert
        Assert.That(href, Does.Contain("/logout"));
    }

    [Test]
    [Description("REQ-OIDC-08: Session cookie recognized as authenticated")]
    public async Task REQ_INT_015_SessionCookie_AuthenticatedUser_ReturnsUserData()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        var dropdown = await WaitForSelectorAsync("#user-dropdown");

        // Assert
        Assert.That(await dropdown.IsVisibleAsync(), Is.True, "User dropdown should be visible when authenticated");
    }

    [Test]
    [Description("REQ-OIDC-09: BFF health endpoint returns healthy status")]
    public async Task REQ_INT_015_HealthEndpoint_ReturnsHealthy()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/health')
                .then(r => r.ok && r.status === 200 ? r.json() : Promise.reject())
                .then(d => JSON.stringify(d))");

        var health = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(health["status"]!.GetValue<string>(), Is.EqualTo("healthy"));
    }

    [Test]
    [Description("REQ-OIDC-10: Auth server login page is accessible")]
    public async Task REQ_INT_015_AccountLoginPage_ReturnsHtml()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/account/login')
                .then(r => JSON.stringify({ status: r.status, type: r.headers.get('content-type') }))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(200));
        Assert.That(result["type"]!.GetValue<string>(), Does.Contain("text/html"));
    }

    [Test]
    [Description("REQ-OIDC-11: Auth server register page is accessible")]
    public async Task REQ_INT_015_AccountRegisterPage_ReturnsHtml()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/account/register')
                .then(r => JSON.stringify({ status: r.status, type: r.headers.get('content-type') }))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(200));
        Assert.That(result["type"]!.GetValue<string>(), Does.Contain("text/html"));
    }

    [Test]
    [Description("REQ-OIDC-12: Session cookie has __Host- prefix and correct properties")]
    public async Task REQ_INT_015_SessionCookie_HasCorrectProperties()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        var cookies = await Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");

        // Assert
        Assert.That(sessionCookie, Is.Not.Null, "__Host-pmo.session cookie should exist");
        Assert.That(sessionCookie!.Secure, Is.True, "Cookie should be Secure");
        Assert.That(sessionCookie.Path, Is.EqualTo("/"), "Cookie path should be /");
    }

    [Test]
    [Description("REQ-OIDC-13: Session persists across SPA route changes")]
    public async Task REQ_INT_015_Session_PersistsAcrossSpaNavigation()
    {
        // Arrange
        await NavigateAsUser("/projects");
        await WaitForSelectorAsync("#project-list-table-body tr", 2);

        // Act
        await NavigateSpaAsync("/");
        await Task.Delay(500);

        var stillLoggedIn = await Page.Locator("#user-dropdown").IsVisibleAsync();

        // Assert
        Assert.That(stillLoggedIn, Is.True, "User should remain logged in after SPA navigation");
    }

    [Test]
    [Description("REQ-OIDC-14: No session returns 401 on API calls")]
    public async Task REQ_INT_015_UnauthenticatedApiCall_Returns401()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => JSON.stringify({ status: r.status }))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(401));
    }

    [Test]
    [Description("REQ-OIDC-15: Different session scopes produce different user data")]
    public async Task REQ_INT_015_DifferentSessionValues_ReturnDifferentUserData()
    {
        // Arrange
        await SetSessionCookie("owner-session");

        // Act
        var ownerJson = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => r.json())
                .then(d => JSON.stringify({ name: d.name }))");
        var ownerResult = JsonNode.Parse(ownerJson)!.AsObject();

        // Assert
        Assert.That(ownerResult["name"]!.GetValue<string>(), Is.EqualTo("Test Owner"));

        // Arrange
        await SetSessionCookie("nonowner-session");

        // Act
        var nonOwnerJson = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => r.json())
                .then(d => JSON.stringify({ name: d.name }))");
        var nonOwnerResult = JsonNode.Parse(nonOwnerJson)!.AsObject();

        // Assert
        Assert.That(nonOwnerResult["name"]!.GetValue<string>(), Is.EqualTo("Test NonOwner"));
        Assert.That(nonOwnerResult["name"]!.GetValue<string>(), Is.Not.EqualTo(ownerResult["name"]!.GetValue<string>()));
    }

    [Test]
    [Description("REQ-OAUTH2-01: OAuth 2.1 grants supported (authorization_code only, no implicit/password/client_credentials)")]
    public async Task REQ_INT_015_OidcDiscovery_EnforcesOAuth2p1Grants()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify({ types: d.response_types_supported, grants: d.grant_types_supported }))");

        var doc = JsonNode.Parse(json)!.AsObject();
        var responseTypes = doc["types"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        var grantTypes = doc["grants"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();

        // Assert
        Assert.That(responseTypes, Is.EquivalentTo(new[] { "code" }),
            "OAuth 2.1 requires only authorization_code grant (response_type=code)");

        Assert.That(grantTypes, Does.Not.Contain("implicit"));
        Assert.That(grantTypes, Does.Not.Contain("password"));
        Assert.That(grantTypes, Does.Not.Contain("client_credentials"));
    }

    [Test]
    [Description("REQ-OAUTH2-02: Response type is code only (no implicit flow)")]
    public async Task REQ_INT_015_OidcDiscovery_CodeResponseTypeOnly()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify(d.response_types_supported))");

        var types = JsonNode.Parse(json)!.AsArray().Select(n => n!.GetValue<string>()).ToArray();

        // Assert
        Assert.That(types, Is.EquivalentTo(new[] { "code" }));
    }

    [Test]
    [Description("REQ-OAUTH2-03: PKCE S256 code challenge method supported")]
    public async Task REQ_INT_015_OidcDiscovery_SupportsS256Pkce()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify(d.code_challenge_methods_supported))");

        var methods = JsonNode.Parse(json)!.AsArray().Select(n => n!.GetValue<string>()).ToArray();

        // Assert
        Assert.That(methods, Does.Contain("S256"));
    }

    [Test]
    [Description("REQ-OAUTH2-04: Discovery document requires PKCE (require_pkce=true)")]
    public async Task REQ_INT_015_OidcDiscovery_RequiresPkce()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify(d.require_pkce))");

        var requirePkce = JsonNode.Parse(json)!.GetValue<bool>();

        // Assert
        Assert.That(requirePkce, Is.True, "OAuth 2.1 requires PKCE enforcement");
    }

    [Test]
    [Description("REQ-OAUTH2-05: Token endpoint rejects password grant type")]
    public async Task REQ_INT_015_TokenEndpoint_RejectsPasswordGrant()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=password&username=test&password=test'
            }).then(r => r.json().then(e => JSON.stringify({ status: r.status, error: e.error })))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(400));
        Assert.That(result["error"]!.GetValue<string>(), Does.Contain("unsupported_grant_type"));
    }

    [Test]
    [Description("REQ-OAUTH2-06: Token endpoint rejects implicit grant type")]
    public async Task REQ_INT_015_TokenEndpoint_RejectsImplicitGrant()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=implicit'
            }).then(r => r.json().then(e => JSON.stringify({ status: r.status, error: e.error })))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(400));
        Assert.That(result["error"]!.GetValue<string>(), Does.Contain("unsupported_grant_type"));
    }

    [Test]
    [Description("REQ-OAUTH2-07: Token endpoint requires PKCE code_verifier")]
    public async Task REQ_INT_015_TokenEndpoint_RequiresCodeVerifier()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=authorization_code&code=testcode'
            }).then(r => r.json().then(e => JSON.stringify({ status: r.status, error: e.error })))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(400));
        Assert.That(result["error"]!.GetValue<string>(), Does.Contain("invalid_request"));
    }

    [Test]
    [Description("REQ-OAUTH2-08: Token endpoint rejects client_credentials grant for public client")]
    public async Task REQ_INT_015_TokenEndpoint_RejectsClientCredentialsGrant()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'grant_type=client_credentials&client_id=pmo-spa'
            }).then(r => r.json().then(e => JSON.stringify({ status: r.status, error: e.error })))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(400));
        Assert.That(result["error"]!.GetValue<string>(), Does.Contain("unsupported_grant_type"));
    }

    [Test]
    [Description("REQ-OIDC-16: Authorize endpoint handles redirect_uri parameter")]
    public async Task REQ_INT_015_AuthorizeEndpoint_AcceptsRedirectUri()
    {
        await Page.GotoAsync(BaseUrl + "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=" + Uri.EscapeDataString("https://localhost:9000/signin-oidc"), new PageGotoOptions { Timeout = 2000 });
        Assert.That(await WaitUntilAsync(() => Task.FromResult(Page.Url.Contains("/account/login")), 2), Is.True,
            "Should redirect to login page");
    }

    [Test]
    [Description("REQ-OIDC-17: Token endpoint is reachable")]
    public async Task REQ_INT_015_TokenEndpoint_IsReachable()
    {
        // Act
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', { method: 'POST', redirect: 'manual' })
                .then(r => JSON.stringify({ status: r.status }))");

        var result = JsonNode.Parse(json)!.AsObject();

        // Assert
        Assert.That(result["status"]!.GetValue<int>(), Is.Not.EqualTo(404));
    }
}
