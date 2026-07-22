using System.Net;
using System.Text.Json;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class OidcFlowIntegrationTests : IntegrationTestBase
{
    private const string ClientId = "pmo-spa";
    private const string RedirectUri = "https://localhost:9000/signin-oidc";
    private const string Scope = "openid profile email offline_access projects.read projects.write";
    private const string CodeVerifier = "e9a2d8f7b1c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8";

    private string CodeChallenge => ComputeS256CodeChallenge(CodeVerifier);

    /// <summary>Build form-url-encoded params for a pushed authorization request.</summary>
    private Dictionary<string, string> BuildParParams(
        string? redirectUri = null,
        string? scope = null,
        string? state = null,
        string? codeChallenge = null,
        string? codeChallengeMethod = "S256",
        string? clientId = null)
    {
        var s = state ?? Guid.NewGuid().ToString("N");
        var cc = codeChallenge ?? CodeChallenge;
        return new Dictionary<string, string>
        {
            { "client_id", clientId ?? ClientId },
            { "redirect_uri", redirectUri ?? RedirectUri },
            { "response_type", "code" },
            { "scope", scope ?? Scope },
            { "state", s },
            { "code_challenge", cc },
            { "code_challenge_method", codeChallengeMethod ?? "S256" },
        };
    }

    /// <summary>POST to the Pushed Authorization Request endpoint and return the request_uri.</summary>
    private async Task<string> PushedAuthorizeAsync(Dictionary<string, string>? overrides = null)
    {
        var body = BuildParParams();
        if (overrides is not null)
            foreach (var (key, value) in overrides)
                if (value is null) body.Remove(key);
                else body[key] = value;

        var response = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            "PAR endpoint should return 200 OK");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("request_uri").GetString()
            ?? throw new InvalidOperationException("PAR response missing request_uri");
    }

    /// <summary>Build an authorize URL that uses the PAR request_uri.</summary>
    private string BuildAuthorizeWithPar(Dictionary<string, string>? parOverrides = null)
    {
        var requestUri = PushedAuthorizeAsync(parOverrides).GetAwaiter().GetResult();
        return $"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}";
    }

    // ============================
    // UNAUTHENTICATED TESTS
    // ============================

    [Test]
    public async Task REQ_INT_015_Get_Authorize_WithoutSession_RedirectsToLogin()
    {
        var requestUri = await PushedAuthorizeAsync();
        var response = await Client.GetAsync($"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
        Assert.That(location, Does.Contain("returnUrl="));
    }

    [Test]
    public async Task REQ_INT_015_Get_Authorize_WithoutOpenIdScope_ReturnsBadRequest()
    {
        var body = BuildParParams(scope: "profile");
        var response = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // AUTHORIZATION CODE FLOW (happy path)
    // ============================

    [Test]
    public async Task REQ_INT_015_Authorize_WithSession_ReturnsAuthorizationCode()
    {
        var code = await PerformAuthorizationCodeFlow();
        Assert.That(code, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    public async Task REQ_INT_015_Token_AuthorizationCode_ReturnsTokens()
    {
        var code = await PerformAuthorizationCodeFlow();
        var tokens = await ExchangeCodeForTokens(code);
        Assert.That(tokens, Is.Not.Null);
        Assert.That(tokens!.AccessToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.IdToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.RefreshToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.TokenType, Is.EqualTo("Bearer"));
    }

    [Test]
    public async Task REQ_INT_015_Token_RefreshToken_RotatesTokens()
    {
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);
        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.RefreshToken, Is.Not.Null);
        Assert.That(secondTokens.RefreshToken, Is.Not.EqualTo(firstTokens.RefreshToken));
    }

    [Test]
    public async Task REQ_INT_015_Token_MissingCodeVerifier_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_WrongCodeVerifier_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 AUTHORIZATION CODE MISUSE CASES
    // ============================

    [Test]
    public async Task REQ_INT_015_Authorize_MissingCodeChallenge_ReturnsError()
    {
        var authCookie = await AuthCookieAsync();
        var body = BuildParParams(codeChallenge: null, codeChallengeMethod: null);
        var parResponse = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));
        Assert.That(parResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Authorize_MissingCodeChallengeMethod_ReturnsBadRequest()
    {
        var authCookie = await AuthCookieAsync();
        var body = BuildParParams(codeChallenge: CodeChallenge, codeChallengeMethod: null);
        var parResponse = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));
        Assert.That(parResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_AuthorizationCodeReplay_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();

        var firstResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));
        Assert.That(firstResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var secondResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));
        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_CodeWithWrongRedirectUri_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", "https://evil.com/callback" },
                { "client_id", ClientId }
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_CodeWithWrongClientId_ReturnsUnauthorized()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", "wrong-client" }
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_015_Token_MissingClientId_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // OTHER AUTHORIZE SCENARIOS
    // ============================

    [Test]
    public async Task REQ_INT_015_Authorize_MissingState_StillSucceeds()
    {
        var authCookie = await AuthCookieAsync();
        var requestUri = await PushedAuthorizeAsync(new Dictionary<string, string> { { "state", null! } });

        var request = CreateGet($"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}", authCookie);
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("code="));
    }

    [Test]
    public async Task REQ_INT_015_Authorize_MultipleSessions_AllValid()
    {
        async Task<string> GetCode()
        {
            var code = await PerformAuthorizationCodeFlow();
            var tokens = await ExchangeCodeForTokens(code);
            Assert.That(tokens, Is.Not.Null);
            Assert.That(tokens!.AccessToken, Is.Not.Null.And.Not.Empty);
            return tokens.AccessToken!;
        }

        var token1 = await GetCode();
        var token2 = await GetCode();
        Assert.That(token1, Is.Not.EqualTo(token2));
    }

    // ============================
    // 🚫 REFRESH TOKEN MISUSE CASES
    // ============================

    [Test]
    public async Task REQ_INT_015_Token_RefreshTokenReplay_AfterRotation_InvalidatesFamily()
    {
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);
        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.RefreshToken, Is.Not.Null);

        var replayResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(replayResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var staleResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", secondTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(staleResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_RefreshTokenMissingClientId_ReturnsUnauthorized()
    {
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_015_Token_ScopeChange_AtTokenEndpoint_ReturnsBadRequest()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "scope", "openid" },
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_ScopeUpgrade_AtTokenEndpoint_ReturnsBadRequest()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "scope", "openid profile email offline_access projects.read projects.write calendar.read" },
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_INT_015_Token_PublicClientSendsSecret_ReturnsUnauthorized()
    {
        var code = await PerformAuthorizationCodeFlow();
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "client_secret", "some-secret" },
            }
        ));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_INT_015_Revoke_RefreshToken_InvalidatesIt()
    {
        var code = await PerformAuthorizationCodeFlow();
        var tokens = await ExchangeCodeForTokens(code);
        Assert.That(tokens!.RefreshToken, Is.Not.Null);

        var revokeResponse = await Client.PostAsync("/connect/revocation", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "token", tokens.RefreshToken },
                { "token_type_hint", "refresh_token" },
                { "client_id", ClientId },
            }
        ));
        Assert.That(revokeResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var staleResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", tokens.RefreshToken },
                { "client_id", ClientId },
            }
        ));
        Assert.That(staleResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // PRIVATE HELPERS
    // ============================

    private async Task<string> PerformAuthorizationCodeFlow()
    {
        var requestUri = await PushedAuthorizeAsync();
        var authorizeUrl = $"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}";

        var authResponse = await Client.GetAsync(authorizeUrl);
        var loginUrl = await ExtractRedirectLocation(authResponse);

        var loginResponse = await Client.GetAsync(loginUrl);
        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var loginHtml = await loginResponse.Content.ReadAsStringAsync();
        var antiforgeryToken = ExtractAntiforgeryToken(loginHtml);
        var antiforgeryCookie = ExtractSetCookieHeader(loginResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgeryCookie, Is.Not.Null);

        var returnUrl = ExtractQueryParam(loginUrl, "returnUrl");
        var loginForm = new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" },
            { "ReturnUrl", returnUrl },
            { "__RequestVerificationToken", antiforgeryToken }
        };
        var loginRequest = CreatePost("/account/login", loginForm, antiforgeryCookie);
        var loginPostResponse = await Client.SendAsync(loginRequest);

        Assert.That(loginPostResponse.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var authorizedUrl = await ExtractRedirectLocation(loginPostResponse);

        var authCookie = ExtractSetCookieHeader(loginPostResponse, "__Host-pmo.auth");
        Assert.That(authCookie, Is.Not.Null, "Auth cookie not found in login response");

        var authRequest = CreateGet(authorizedUrl, authCookie);
        var finalResponse = await Client.SendAsync(authRequest);
        Assert.That(finalResponse.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var finalLocation = await ExtractRedirectLocation(finalResponse);
        Assert.That(finalLocation, Does.Contain("code="));

        return ExtractQueryParam(finalLocation, "code");
    }

    private async Task<TokenResponse?> ExchangeCodeForTokens(string code)
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<TokenResponse>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });
    }

    private async Task<TokenResponse?> ExchangeRefreshToken(string refreshToken)
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", refreshToken },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<TokenResponse>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });
    }

    private async Task<string> AuthCookieAsync()
    {
        var loginResponse = await Client.GetAsync("/account/login");
        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var loginHtml = await loginResponse.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(loginHtml);
        var antiforgeryCookie = ExtractSetCookieHeader(loginResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgeryCookie, Is.Not.Null);

        var request = CreatePost("/account/login", new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" },
            { "__RequestVerificationToken", token }
        }, antiforgeryCookie);
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var cookie = ExtractSetCookieHeader(response, "__Host-pmo.auth");
        Assert.That(cookie, Is.Not.Null, "Identity cookie not found in login response");
        return cookie!;
    }

    private record TokenResponse
    {
        public string? AccessToken { get; set; }
        public string? TokenType { get; set; }
        public int? ExpiresIn { get; set; }
        public string? RefreshToken { get; set; }
        public string? IdToken { get; set; }
        public string? Scope { get; set; }
    }
}
