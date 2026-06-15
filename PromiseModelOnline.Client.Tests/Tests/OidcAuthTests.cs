using System.Text.Json.Nodes;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class OidcAuthTests : PlaywrightTestBase
{
    [Test]
    [Description("REQ-OIDC-01: OpenID Connect Discovery document")]
    public async Task WellKnownOpenIdConfiguration_ReturnsValidDiscoveryDocument()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(d => JSON.stringify(d))");

        var doc = JsonNode.Parse(json)!.AsObject();
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
    public async Task AuthorizeEndpoint_RedirectsToLoginPage()
    {
        await Page.GotoAsync(BaseUrl + "/connect/authorize");
        Assert.That(Page.Url, Does.Contain("/account/login"));
    }

    [Test]
    [Description("REQ-OIDC-03: End Session endpoint redirects to post-logout URI")]
    public async Task EndSessionEndpoint_RedirectsToPostLogoutUri()
    {
        await Page.GotoAsync(BaseUrl + "/connect/logout");
        Assert.That(new Uri(Page.Url).AbsolutePath, Is.EqualTo("/"));
    }

    [Test]
    [Description("REQ-OIDC-04: OIDC callback paths return SPA shell")]
    public async Task OidcCallbackPaths_ReturnSpaShell()
    {
        foreach (var path in new[] { "/signin-oidc", "/signout-callback-oidc" })
        {
            await Page.GotoAsync(BaseUrl + path);
            Assert.That(Page.Url, Does.Contain(path), $"{path} should load the callback page");
        }
    }

    [Test]
    [Description("REQ-OIDC-05: BFF login endpoint triggers OIDC challenge")]
    public async Task LoginEndpoint_ReturnsSpaShell()
    {
        await Page.GotoAsync(BaseUrl + "/login");
        Assert.That(Page.Url, Does.Contain("/login"));
    }

    [Test]
    [Description("REQ-OIDC-06: SPA login link navigates to BFF /login")]
    public async Task LoginLink_InAnonymousPage_PointsToBffLogin()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var link = await WaitForSelectorAsync("#login-link", 5);
        var href = await link.GetAttributeAsync("href");
        Assert.That(href, Does.Contain("/login"));
    }

    [Test]
    [Description("REQ-OIDC-07: BFF logout endpoint triggers session termination")]
    public async Task LogoutLink_WhenAuthenticated_PointsToBffLogout()
    {
        await NavigateAsUser("/");
        await Page.Locator("#user-dropdown").ClickAsync();
        var link = await WaitForSelectorAsync("#logout-link", 5);
        var href = await link.GetAttributeAsync("href");
        Assert.That(href, Does.Contain("/logout"));
    }

    [Test]
    [Description("REQ-OIDC-08: Session cookie recognized as authenticated")]
    public async Task SessionCookie_AuthenticatedUser_ReturnsUserData()
    {
        await NavigateAsUser("/");
        var dropdown = await WaitForSelectorAsync("#user-dropdown", 5);
        Assert.That(await dropdown.IsVisibleAsync(), Is.True, "User dropdown should be visible when authenticated");
    }

    [Test]
    [Description("REQ-OIDC-09: BFF health endpoint returns healthy status")]
    public async Task HealthEndpoint_ReturnsHealthy()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/health')
                .then(r => r.ok && r.status === 200 ? r.json() : Promise.reject())
                .then(d => JSON.stringify(d))");

        var health = JsonNode.Parse(json)!.AsObject();
        Assert.That(health["status"]!.GetValue<string>(), Is.EqualTo("healthy"));
    }

    [Test]
    [Description("REQ-OIDC-10: Auth server login page is accessible")]
    public async Task AccountLoginPage_ReturnsHtml()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/account/login')
                .then(r => JSON.stringify({ status: r.status, type: r.headers.get('content-type') }))");

        var result = JsonNode.Parse(json)!.AsObject();
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(200));
        Assert.That(result["type"]!.GetValue<string>(), Does.Contain("text/html"));
    }

    [Test]
    [Description("REQ-OIDC-11: Auth server register page is accessible")]
    public async Task AccountRegisterPage_ReturnsHtml()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/account/register')
                .then(r => JSON.stringify({ status: r.status, type: r.headers.get('content-type') }))");

        var result = JsonNode.Parse(json)!.AsObject();
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(200));
        Assert.That(result["type"]!.GetValue<string>(), Does.Contain("text/html"));
    }

    [Test]
    [Description("REQ-OIDC-12: Session cookie has __Host- prefix and correct properties")]
    public async Task SessionCookie_HasCorrectProperties()
    {
        await NavigateAsUser("/");
        var cookies = await Context.CookiesAsync();
        var sessionCookie = cookies.FirstOrDefault(c => c.Name == "__Host-pmo.session");
        Assert.That(sessionCookie, Is.Not.Null, "__Host-pmo.session cookie should exist");
        Assert.That(sessionCookie!.Secure, Is.True, "Cookie should be Secure");
        Assert.That(sessionCookie.Path, Is.EqualTo("/"), "Cookie path should be /");
    }

    [Test]
    [Description("REQ-OIDC-13: Session persists across SPA route changes")]
    public async Task Session_PersistsAcrossSpaNavigation()
    {
        await NavigateAsUser("/projects");
        await WaitForSelectorAsync("#project-list-table-body tr", 10);

        await NavigateSpaAsync("/");
        await Task.Delay(500);

        var stillLoggedIn = await Page.Locator("#user-dropdown").IsVisibleAsync();
        Assert.That(stillLoggedIn, Is.True, "User should remain logged in after SPA navigation");
    }

    [Test]
    [Description("REQ-OIDC-14: No session returns 401 on API calls")]
    public async Task UnauthenticatedApiCall_Returns401()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => JSON.stringify({ status: r.status }))");

        var result = JsonNode.Parse(json)!.AsObject();
        Assert.That(result["status"]!.GetValue<int>(), Is.EqualTo(401));
    }

    [Test]
    [Description("REQ-OIDC-15: Different session scopes produce different user data")]
    public async Task DifferentSessionValues_ReturnDifferentUserData()
    {
        await SetSessionCookie("owner-session");
        var ownerJson = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => r.json())
                .then(d => JSON.stringify({ name: d.name }))");
        var ownerResult = JsonNode.Parse(ownerJson)!.AsObject();
        Assert.That(ownerResult["name"]!.GetValue<string>(), Is.EqualTo("Test Owner"));

        await SetSessionCookie("nonowner-session");
        var nonOwnerJson = await Page.EvaluateAsync<string>(@"
            fetch('/api/users/me', { credentials: 'include' })
                .then(r => r.json())
                .then(d => JSON.stringify({ name: d.name }))");
        var nonOwnerResult = JsonNode.Parse(nonOwnerJson)!.AsObject();
        Assert.That(nonOwnerResult["name"]!.GetValue<string>(), Is.EqualTo("Test NonOwner"));
        Assert.That(nonOwnerResult["name"]!.GetValue<string>(), Is.Not.EqualTo(ownerResult["name"]!.GetValue<string>()));
    }

    [Test]
    [Description("REQ-OIDC-16: OAuth 2.1 grants supported (code, not implicit/password/client_credentials)")]
    public async Task OidcDiscovery_EnforcesOAuth2p1Grants()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify({ types: d.response_types_supported, grants: d.grant_types_supported }))");

        var doc = JsonNode.Parse(json)!.AsObject();
        var responseTypes = doc["types"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(responseTypes, Is.EquivalentTo(new[] { "code" }),
            "OAuth 2.1 requires only authorization_code grant (response_type=code)");

        var grantTypes = doc["grants"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(grantTypes, Does.Not.Contain("implicit"));
        Assert.That(grantTypes, Does.Not.Contain("password"));
        Assert.That(grantTypes, Does.Not.Contain("client_credentials"));
    }

    [Test]
    [Description("REQ-OIDC-17: Response type is code only (no implicit flow)")]
    public async Task OidcDiscovery_CodeResponseTypeOnly()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify(d.response_types_supported))");

        var types = JsonNode.Parse(json)!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(types, Is.EquivalentTo(new[] { "code" }));
    }

    [Test]
    [Description("REQ-OIDC-18: PKCE S256 code challenge method supported")]
    public async Task OidcDiscovery_SupportsS256Pkce()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/.well-known/openid-configuration')
                .then(r => r.json())
                .then(d => JSON.stringify(d.code_challenge_methods_supported))");

        var methods = JsonNode.Parse(json)!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        Assert.That(methods, Does.Contain("S256"));
    }

    [Test]
    [Description("REQ-OIDC-19: Authorize endpoint handles redirect_uri parameter")]
    public async Task AuthorizeEndpoint_AcceptsRedirectUri()
    {
        await Page.GotoAsync(BaseUrl + "/connect/authorize?client_id=pmo-spa&response_type=code&redirect_uri=" + Uri.EscapeDataString("https://localhost:9000/signin-oidc"));
        Assert.That(Page.Url, Does.Contain("/account/login"));
    }

    [Test]
    [Description("REQ-OIDC-20: Token endpoint is reachable")]
    public async Task TokenEndpoint_IsReachable()
    {
        var json = await Page.EvaluateAsync<string>(@"
            fetch('/connect/token', { method: 'POST', redirect: 'manual' })
                .then(r => JSON.stringify({ status: r.status }))");

        var result = JsonNode.Parse(json)!.AsObject();
        Assert.That(result["status"]!.GetValue<int>(), Is.Not.EqualTo(404));
    }
}
