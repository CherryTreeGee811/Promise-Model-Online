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

    private string BuildAuthorizeUrl()
    {
        var state = Guid.NewGuid().ToString("N");
        return $"/connect/authorize?client_id={Uri.EscapeDataString(ClientId)}" +
               $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}" +
               "&response_type=code" +
               $"&scope={Uri.EscapeDataString(Scope)}" +
               $"&state={Uri.EscapeDataString(state)}" +
               $"&code_challenge={CodeChallenge}" +
               "&code_challenge_method=S256";
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
        // First authenticate
        var authCookie = await AuthCookieAsync();

        var url = $"/connect/authorize?client_id={Uri.EscapeDataString(ClientId)}" +
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
    // AUTHORIZATION CODE FLOW
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
    // ERROR CASES
    // ============================

    [Test]
    public async Task Token_InvalidCode_ReturnsError()
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", "invalid_code" },
                { "code_verifier", CodeVerifier },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Token_InvalidRefreshToken_ReturnsError()
    {
        var response = await Client.PostAsync("/connect/token", new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                { "grant_type", "refresh_token" },
                { "refresh_token", "invalid_refresh_token" },
                { "client_id", ClientId }
            }
        ));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
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
