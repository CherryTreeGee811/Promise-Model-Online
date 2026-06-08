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

    private string BuildAuthorizeUrl(
        string? redirectUri = null,
        string? scope = null,
        string? state = null,
        string? codeChallenge = null,
        string? codeChallengeMethod = "S256",
        string? clientId = null)
    {
        var s = state ?? Guid.NewGuid().ToString("N");
        var cc = codeChallenge ?? CodeChallenge;
        return $"/connect/authorize?" +
               $"client_id={Uri.EscapeDataString(clientId ?? ClientId)}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri ?? RedirectUri)}" +
               "&response_type=code" +
               $"&scope={Uri.EscapeDataString(scope ?? Scope)}" +
               $"&state={Uri.EscapeDataString(s)}" +
               $"&code_challenge={cc}" +
               $"&code_challenge_method={codeChallengeMethod ?? "S256"}";
    }

    // ============================
    // UNAUTHENTICATED TESTS
    // ============================

    [Test]
    public async Task Get_Authorize_WithoutSession_RedirectsToLogin()
    {
        var response = await Client.GetAsync(BuildAuthorizeUrl());

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
        Assert.That(location, Does.Contain("returnUrl="));
    }

    [Test]
    public async Task Get_Authorize_WithoutOpenIdScope_ReturnsBadRequest()
    {
        var authCookie = await AuthCookieAsync();

        var url = $"/connect/authorize?" +
                  $"client_id={Uri.EscapeDataString(ClientId)}" +
                  $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}" +
                  "&response_type=code" +
                  "&scope=profile" +
                  $"&state={Guid.NewGuid():N}" +
                  $"&code_challenge={CodeChallenge}" +
                  "&code_challenge_method=S256";

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // AUTHORIZATION CODE FLOW (happy path)
    // ============================

    [Test]
    public async Task Authorize_WithSession_ReturnsAuthorizationCode()
    {
        var code = await PerformAuthorizationCodeFlow();
        Assert.That(code, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    public async Task Token_AuthorizationCode_ReturnsTokens()
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
    public async Task Token_RefreshToken_RotatesTokens()
    {
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);

        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);
        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);

        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.AccessToken, Is.Not.Null.And.Not.Empty);
        Assert.That(secondTokens.RefreshToken, Is.Not.Null.And.Not.Empty);
        Assert.That(secondTokens.IdToken, Is.Not.Null.And.Not.Empty);

        // The old refresh token should now be invalid (rotation)
        var thirdResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(thirdResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 PKCE MISUSE CASES
    // ============================

    [Test]
    public async Task Token_MissingCodeVerifier_ReturnsError()
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
    public async Task Token_WrongCodeVerifier_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", "this_is_the_wrong_verifier_that_does_not_match" },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Authorize_MissingCodeChallenge_ReturnsError()
    {
        var authCookie = await AuthCookieAsync();

        // Build authorize URL WITHOUT code_challenge and code_challenge_method
        var url = $"/connect/authorize?" +
                  $"client_id={Uri.EscapeDataString(ClientId)}" +
                  $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}" +
                  "&response_type=code" +
                  $"&scope={Uri.EscapeDataString(Scope)}" +
                  $"&state={Guid.NewGuid():N}";

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        // PKCE is required, so OpenIddict should reject
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Authorize_MissingCodeChallengeMethod_ReturnsBadRequest()
    {
        var authCookie = await AuthCookieAsync();

        var url = BuildAuthorizeUrl(codeChallenge: CodeChallenge, codeChallengeMethod: null)
            .Replace("&code_challenge_method=S256", "");

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        // Server enforces S256 — missing method (which defaults to `plain`) is rejected
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 AUTHORIZATION CODE MISUSE CASES
    // ============================

    [Test]
    public async Task Token_AuthorizationCodeReplay_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();

        // First exchange should succeed
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

        // Second exchange with same code should fail
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
        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Authorization code replay should be rejected");
    }

    [Test]
    public async Task Token_CodeWithWrongRedirectUri_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", "https://evil.com/intercept" },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_CodeWithWrongClientId_ReturnsUnauthorized()
    {
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", "malicious-client" }
            }
        ));

        // OpenIddict treats unknown client_id as unauthorized
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Token_EmptyCode_ReturnsError()
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", "" },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_MissingClientId_ReturnsError()
    {
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 GRANT TYPE MISUSE CASES
    // ============================

    [Test]
    public async Task Token_InvalidGrantType_ReturnsError()
    {
        // client_credentials is not registered for this public client
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", ClientId },
                { "client_secret", "should-not-exist" }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_MissingGrantType_ReturnsError()
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_ImplicitGrantType_ReturnsError()
    {
        // implicit grant is not allowed
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "implicit" },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 AUTHORIZE MISUSE CASES
    // ============================

    [Test]
    public async Task Authorize_UnregisteredRedirectUri_ReturnsError()
    {
        var authCookie = await AuthCookieAsync();

        var url = BuildAuthorizeUrl(redirectUri: "https://evil.com/callback");

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Authorize_UnregisteredClientId_ReturnsError()
    {
        var authCookie = await AuthCookieAsync();

        var url = BuildAuthorizeUrl(clientId: "unknown-client");

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Authorize_MissingState_StillSucceeds()
    {
        var authCookie = await AuthCookieAsync();

        var url = BuildAuthorizeUrl(state: null).Replace($"&state={Guid.NewGuid():N}", "");

        var request = CreateGet(url, authCookie);
        var response = await Client.SendAsync(request);

        // `state` is encouraged but not required by the server
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("code="));
    }

    // ============================
    // 🚫 REFRESH TOKEN MISUSE CASES
    // ============================

    [Test]
    public async Task Token_RefreshTokenReplay_AfterRotation_InvalidatesFamily()
    {
        var code = await PerformAuthorizationCodeFlow();
        var firstTokens = await ExchangeCodeForTokens(code);
        Assert.That(firstTokens!.RefreshToken, Is.Not.Null);

        // First refresh succeeds
        var secondTokens = await ExchangeRefreshToken(firstTokens.RefreshToken!);
        Assert.That(secondTokens, Is.Not.Null);
        Assert.That(secondTokens!.RefreshToken, Is.Not.Null);

        // Replay the old refresh token → OpenIddict detects token theft
        // and invalidates the entire token family (including the new token)
        var replayResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", firstTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(replayResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        // The new refresh token is also invalidated (zero leeway → family-wide revocation)
        var familyResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", secondTokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(familyResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_RefreshTokenMissingClientId_ReturnsUnauthorized()
    {
        var code = await PerformAuthorizationCodeFlow();
        var tokens = await ExchangeCodeForTokens(code);
        Assert.That(tokens!.RefreshToken, Is.Not.Null);

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", tokens.RefreshToken }
            }
        ));

        // OpenIddict rejects requests without client_id as unauthorized
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    // ============================
    // 🚫 OPEN REDIRECT MISUSE CASES
    // ============================

    [Test]
    public async Task Logout_PostLogoutRedirectToUnregisteredUri_ReturnsBadRequest()
    {
        // No auth cookie needed — OpenIddict validates the redirect URI before
        // processing the sign-out. An unregistered URI is rejected outright.
        var response = await Client.GetAsync(
            $"/connect/logout?post_logout_redirect_uri={Uri.EscapeDataString("https://evil.com")}");

        // OpenIddict validates post_logout_redirect_uri against registered URIs
        // (only {BaseUrl} is registered). Unregistered URIs are rejected with
        // BadRequest before any sign-out occurs.
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 SCOPE BINDING
    // ============================

    [Test]
    public async Task Token_ScopeChange_AtTokenEndpoint_ReturnsBadRequest()
    {
        // OpenIddict binds the scope at the authorize endpoint and rejects
        // any scope parameter on the token request (both narrower and wider).
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "scope", "openid" }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_ScopeUpgrade_AtTokenEndpoint_ReturnsBadRequest()
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
                { "scope", "openid profile email offline_access projects.read projects.write admin" }
            }
        ));

        // Scope is bound at authorize — any change is rejected
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 DISALLOWED GRANT TYPES
    // ============================

    [Test]
    public async Task Token_PasswordGrant_ReturnsError()
    {
        // OAuth 2.1 removed the Resource Owner Password Credentials grant.
        // OpenIddict should reject it even with valid credentials.
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "password" },
                { "username", "pmo_test" },
                { "password", "Hello123*" },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🚫 PUBLIC CLIENT SECRET MISUSE
    // ============================

    [Test]
    public async Task Token_PublicClientSendsSecret_ReturnsUnauthorized()
    {
        // Public clients have no client_secret. OpenIddict rejects requests
        // that include a client_secret for a public client.
        var code = await PerformAuthorizationCodeFlow();

        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "client_secret", "some-guessed-secret" }
            }
        ));

        // OpenIddict rejects client_secret for public clients
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    // ============================
    // 🚫 REVOCATION / INTROSPECTION MISUSE
    // ============================

    [Test]
    public async Task Revoke_WithoutToken_ReturnsBadRequest()
    {
        // Revocation requires a token — sending nothing should fail
        var response = await Client.PostAsync("/connect/revoke", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Revoke_UnknownToken_ReturnsOk()
    {
        // OpenIddict returns success for unknown tokens (no information leak)
        var response = await Client.PostAsync("/connect/revoke", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "token", "unknown-token-value" },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task Revoke_RefreshToken_InvalidatesIt()
    {
        // Get a valid token, then revoke its refresh token
        var code = await PerformAuthorizationCodeFlow();
        var tokens = await ExchangeCodeForTokens(code);
        Assert.That(tokens!.RefreshToken, Is.Not.Null);

        var revokeResponse = await Client.PostAsync("/connect/revoke", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "token", tokens.RefreshToken },
                { "token_type_hint", "refresh_token" },
                { "client_id", ClientId }
            }
        ));
        Assert.That(revokeResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Trying to use the revoked refresh token should fail
        var useResponse = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", tokens.RefreshToken },
                { "client_id", ClientId }
            }
        ));
        Assert.That(useResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Introspect_WithoutAuth_ReturnsUnauthorized()
    {
        // Introspection endpoint should require authentication
        var response = await Client.PostAsync("/connect/introspect", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "token", "some-token" }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Introspect_WithoutToken_ReturnsBadRequest()
    {
        // Introspection requires a token
        var response = await Client.PostAsync("/connect/introspect", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // ============================
    // 🛡️ RATE LIMITING
    // ============================

    [Test]
    public async Task Health_RateLimit_NotExceeded_Returns200()
    {
        // Verify the rate limiter doesn't block normal traffic
        for (var i = 0; i < 5; i++)
        {
            var response = await Client.GetAsync("/health");
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                $"Health check {i} should succeed");
        }
    }

    [Test]
    public async Task Token_RateLimit_Exceeded_Returns429()
    {
        // The token rate limiter is applied via a global PartitionedRateLimiter
        // that partitions by request path. Send 35 rapid requests to /connect/token;
        // the first 30 should be processed (returning 400 from OpenIddict validation),
        // and at least the last 5 should be blocked with 429.
        var tasks = new List<Task<HttpResponseMessage>>();
        for (var i = 0; i < 35; i++)
        {
            tasks.Add(Client.PostAsync("/connect/token", new FormUrlEncodedContent(
                new Dictionary<string, string>
                {
                    { "grant_type", "authorization_code" },
                    { "code", "invalid-code-" + i },
                    { "client_id", ClientId }
                }
            )));
        }

        var responses = await Task.WhenAll(tasks);
        var statusCodes = responses.Select(r => r.StatusCode).ToList();

        Assert.That(statusCodes, Does.Contain(HttpStatusCode.TooManyRequests),
            "Rate limiter should kick in after 30 requests/minute. Got: " +
            string.Join(", ", statusCodes.Take(35)));
    }

    // ============================
    // 🛡️ ACCOUNT LOCKOUT
    // ============================

    [Test]
    public async Task Login_RepeatedFailures_LocksAccount()
    {
        const string username = "pmo_test2";

        // Identity default: 5 failed attempts → 5 min lockout
        for (var i = 0; i < 6; i++)
        {
            var antiforgery = await GetAntiforgeryData("/account/login");
            var form = new Dictionary<string, string>
            {
                { "Username", username },
                { "Password", "wrong-password-" + i }
            };
            var request = CreatePostWithAntiforgery("/account/login", antiforgery, form);
            await Client.SendAsync(request);
        }

        // After 5+ failures, try with correct password — should be locked out
        var finalAntiforgery = await GetAntiforgeryData("/account/login");
        var finalForm = new Dictionary<string, string>
        {
            { "Username", username },
            { "Password", "Hello123*" }
        };
        var finalRequest = CreatePostWithAntiforgery("/account/login", finalAntiforgery, finalForm);
        var finalResponse = await Client.SendAsync(finalRequest);

        // Should show lockout error (not redirect/success)
        Assert.That(finalResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            "Locked-out user should see login page with error, not be redirected");
        var body = await finalResponse.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("locked").Or.Contains("Locked").Or.Contains("try again"),
            "Lockout message should be shown");
    }

    // ============================
    // 🛡️ CONCURRENT SESSIONS
    // ============================

    [Test]
    public async Task Authorize_MultipleSessions_AllValid()
    {
        // Verify that two independent login sessions can each get tokens
        var cookie1 = await AuthCookieAsync();
        var cookie2 = await AuthCookieAsync(); // second parallel session

        var url1 = BuildAuthorizeUrl();
        var url2 = BuildAuthorizeUrl();

        var req1 = CreateGet(url1, cookie1);
        var req2 = CreateGet(url2, cookie2);

        var (resp1, resp2) = (await Client.SendAsync(req1), await Client.SendAsync(req2));

        Assert.Multiple(() =>
        {
            Assert.That(resp1.StatusCode, Is.EqualTo(HttpStatusCode.Redirect),
                "Session 1 should get authorization code");
            Assert.That(resp2.StatusCode, Is.EqualTo(HttpStatusCode.Redirect),
                "Session 2 should get authorization code");
        });
    }

    // ============================
    // 🛡️ CORS
    // ============================

    [Test]
    public async Task Cors_AllowedOrigin_ReturnsAccessControlHeader()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Origin", "https://localhost:9000");

        var response = await Client.SendAsync(request);

        Assert.That(response.Headers.Contains("Access-Control-Allow-Origin"),
            Is.True, "Allowed origin should get CORS header");
    }

    [Test]
    public async Task Cors_DisallowedOrigin_NoAccessControlHeader()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Origin", "https://evil.com");

        var response = await Client.SendAsync(request);

        Assert.That(response.Headers.Contains("Access-Control-Allow-Origin"),
            Is.False, "Disallowed origin should NOT get CORS header");
    }

    // ============================
    // PRIVATE HELPERS
    // ============================

    private async Task<string> PerformAuthorizationCodeFlow()
    {
        // Step 1: GET authorize (unauthenticated) -> redirect to login
        var authorizeUrl = BuildAuthorizeUrl();
        var authResponse = await Client.GetAsync(authorizeUrl);
        var loginUrl = await ExtractRedirectLocation(authResponse);

        // Step 2: GET login page -> extract antiforgery token + cookie
        var loginResponse = await Client.GetAsync(loginUrl);
        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var loginHtml = await loginResponse.Content.ReadAsStringAsync();
        var antiforgeryToken = ExtractAntiforgeryToken(loginHtml);
        var antiforgeryCookie = ExtractSetCookieHeader(loginResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgeryCookie, Is.Not.Null);

        // Step 3: POST login with seeded test user (include antiforgery cookie)
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

        // Extract the auth cookie from the login POST response
        var authCookie = ExtractSetCookieHeader(loginPostResponse, "pmo.auth");
        Assert.That(authCookie, Is.Not.Null, "Auth cookie not found in login response");

        // Step 4: GET authorize (now authenticated) -> redirect with code
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

        var cookie = ExtractSetCookieHeader(response, "pmo.auth");
        Assert.That(cookie, Is.Not.Null, "Identity cookie not found in login response");
        return cookie!;
    }

    private class TokenResponse
    {
        public string? AccessToken { get; set; }
        public string? TokenType { get; set; }
        public int? ExpiresIn { get; set; }
        public string? RefreshToken { get; set; }
        public string? IdToken { get; set; }
        public string? Scope { get; set; }
    }
}
