using System.Net;
using System.Text.Json;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

[TestFixture]
public class OidcFlowIntegrationTests : IntegrationTestBase
{
    private const string ClientId = "pmo-spa";
    private const string RedirectUri = "https://localhost:9000/signin-oidc";
    private const string Scope = "openid profile email offline_access projects.read projects.write";
    private const string CodeVerifier = "e9a2d8f7b1c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8";

    private string CodeChallenge => ComputeS256CodeChallenge(CodeVerifier);

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

    private async Task<string> PushedAuthorizeAsync(Dictionary<string, string>? overrides = null)
    {
        // Arrange - build PAR body with optional overrides
        var body = BuildParParams();
        if (overrides is not null)
            foreach (var (key, value) in overrides)
                if (value is null) body.Remove(key);
                else body[key] = value;

        // Act - POST to pushed authorization endpoint
        var response = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));

        // Assert - successful PAR returns request_uri
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            $"PAR endpoint returned {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("request_uri").GetString()
            ?? throw new InvalidOperationException("PAR response missing request_uri");
    }

    // ============================
    // UNAUTHENTICATED TESTS
    // ============================

    [Test]
    [Description("REQ_OIDC_002: Authorization endpoint redirects unauthenticated users to login")]
    public async Task REQ_INT_015_Get_Authorize_WithoutSession_RedirectsToLogin()
    {
        // Arrange
        var requestUri = await PushedAuthorizeAsync();

        // Act
        var response = await Client.GetAsync($"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
        Assert.That(location, Does.Contain("returnUrl="));
    }

    [Test]
    [Description("REQ_OIDC_006: Authorize requires openid scope")]
    public async Task REQ_INT_015_Get_Authorize_WithoutOpenIdScope_ReturnsBadRequest()
    {
        // Arrange
        var body = BuildParParams(scope: "profile");

        // Act
        var response = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // AUTHORIZATION CODE FLOW (happy path)
    // ============================

    [Test]
    [Description("REQ_OAUTH_001: Authorization code flow returns code")]
    public async Task REQ_INT_015_Authorize_WithSession_ReturnsAuthorizationCode()
    {
        // Arrange & Act
        var code = await PerformAuthorizationCodeFlow();

        // Assert
        Assert.That(code, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    [Description("REQ_OIDC_005: Token exchange returns access token, ID token, and refresh token")]
    public async Task REQ_INT_015_Token_AuthorizationCode_ReturnsTokens()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
        var tokens = await ExchangeCodeForTokens(code);

        // Assert
        Assert.That(tokens, Is.Not.Null);
        Assert.That(tokens!.AccessToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.IdToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.RefreshToken, Is.Not.Null.And.Not.Empty);
        Assert.That(tokens.TokenType, Is.EqualTo("Bearer"));
    }

    [Test]
    [Description("REQ_OAUTH_003: Refresh token rotation — each refresh yields a new token")]
    public async Task REQ_INT_015_Token_RefreshToken_RotatesTokens()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        // Act
        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);

        // Assert
        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.RefreshToken, Is.Not.Null);
        Assert.That(secondTokens.RefreshToken, Is.Not.EqualTo(firstTokens.RefreshToken));
    }

    [Test]
    [Description("REQ_OAUTH_001: Token exchange without code_verifier is rejected")]
    public async Task REQ_INT_015_Token_MissingCodeVerifier_ReturnsError()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_001: Token exchange with wrong code_verifier is rejected")]
    public async Task REQ_INT_015_Token_WrongCodeVerifier_ReturnsError()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // AUTHORIZATION CODE MISUSE CASES
    // ============================

    [Test]
    [Description("REQ_OAUTH_002: PAR without code_challenge is rejected (PKCE required)")]
    public async Task REQ_INT_015_Authorize_MissingCodeChallenge_ReturnsError()
    {
        // Arrange
        var authCookie = await AuthCookieAsync();
        var body = BuildParParams(codeChallenge: null, codeChallengeMethod: null);

        // Act
        var parResponse = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));

        // Assert
        Assert.That(parResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_002: PAR with missing code_challenge_method defaults to plain which is rejected")]
    public async Task REQ_INT_015_Authorize_MissingCodeChallengeMethod_ReturnsBadRequest()
    {
        // Arrange
        var authCookie = await AuthCookieAsync();
        var body = BuildParParams(codeChallenge: CodeChallenge, codeChallengeMethod: null);

        // Act
        var parResponse = await Client.PostAsync("/connect/authorize/pushed", new FormUrlEncodedContent(body));

        // Assert
        Assert.That(parResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_004: Authorization code replay is rejected (single-use)")]
    public async Task REQ_INT_015_Token_AuthorizationCodeReplay_ReturnsError()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act - first exchange succeeds
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
        Assert.That(firstResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            "First code exchange should succeed");

        // Act - second exchange with same code should fail
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

        // Assert
        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_005: Token exchange with wrong redirect_uri is rejected")]
    public async Task REQ_INT_015_Token_CodeWithWrongRedirectUri_ReturnsError()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_005: Token exchange with wrong client_id returns unauthorized")]
    public async Task REQ_INT_015_Token_CodeWithWrongClientId_ReturnsUnauthorized()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_OAUTH_005: Token exchange without client_id returns error")]
    public async Task REQ_INT_015_Token_MissingClientId_ReturnsError()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
            }
        ));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // OTHER AUTHORIZE SCENARIOS
    // ============================

    [Test]
    [Description("REQ_OIDC_003: Missing state parameter still succeeds (state is optional)")]
    public async Task REQ_INT_015_Authorize_MissingState_StillSucceeds()
    {
        // Arrange
        var authCookie = await AuthCookieAsync();
        var requestUri = await PushedAuthorizeAsync(new Dictionary<string, string> { { "state", null! } });

        // Act
        var request = CreateGet($"/connect/authorize?request_uri={Uri.EscapeDataString(requestUri)}", authCookie);
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("code="));
    }

    [Test]
    [Description("REQ_INT_015: Multiple concurrent sessions all produce valid tokens")]
    public async Task REQ_INT_015_Authorize_MultipleSessions_AllValid()
    {
        // Arrange & Act
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

        // Assert
        Assert.That(token1, Is.Not.EqualTo(token2));
    }

    // ============================
    // REFRESH TOKEN MISUSE CASES
    // ============================

    [Test]
    [Description("REQ_OAUTH_009: Refresh token replay detection invalidates entire token family")]
    public async Task REQ_INT_015_Token_RefreshTokenReplay_AfterRotation_InvalidatesFamily()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);
        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.RefreshToken, Is.Not.Null);

        // Act - replay the old refresh token
        var replayResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));

        // Assert - replay is rejected
        Assert.That(replayResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        // Assert - even the new (second) token is invalidated by the theft detection
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
    [Description("REQ_OAUTH_010: Refresh token request without client_id is unauthorized")]
    public async Task REQ_INT_015_Token_RefreshTokenMissingClientId_ReturnsUnauthorized()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        // Act
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
            }
        ));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_OAUTH_007: Scope reduction at token endpoint is rejected")]
    public async Task REQ_INT_015_Token_ScopeChange_AtTokenEndpoint_ReturnsBadRequest()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act - attempt to narrow scope at token exchange
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_007: Scope upgrade at token endpoint is rejected")]
    public async Task REQ_INT_015_Token_ScopeUpgrade_AtTokenEndpoint_ReturnsBadRequest()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act - attempt to add scope at token exchange
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_OAUTH_011: Public client sending client_secret is rejected")]
    public async Task REQ_INT_015_Token_PublicClientSendsSecret_ReturnsUnauthorized()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();

        // Act
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

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_OAUTH_012: Refresh token revocation invalidates it for future use")]
    public async Task REQ_INT_015_Revoke_RefreshToken_InvalidatesIt()
    {
        // Arrange
        var code = await PerformAuthorizationCodeFlow();
        var tokens = await ExchangeCodeForTokens(code);
        Assert.That(tokens!.RefreshToken, Is.Not.Null);

        // Act - revoke the refresh token
        var revokeResponse = await Client.PostAsync("/connect/revocation", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "token", tokens.RefreshToken },
                { "token_type_hint", "refresh_token" },
                { "client_id", ClientId },
            }
        ));

        // Assert - revocation succeeds
        Assert.That(revokeResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act - attempt to use revoked refresh token
        var staleResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", tokens.RefreshToken },
                { "client_id", ClientId },
            }
        ));

        // Assert - revoked token is rejected
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
        // Act - exchange authorization code for tokens
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

        // Assert - token exchange should succeed
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
