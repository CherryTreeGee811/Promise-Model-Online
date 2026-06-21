using System.Net;
using System.Text.RegularExpressions;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public abstract class IntegrationTestBase
{
    protected AuthWebApplicationFactory Factory { get; private set; } = null!;
    protected HttpClient Client { get; private set; } = null!;

    [SetUp]
    public async Task Setup()
    {
        SetTestEnvironmentVariables();
        Factory = new AuthWebApplicationFactory();
        await Factory.InitializeAsync();

        Client = Factory.CreateClient();
        Client.BaseAddress = new Uri("http://localhost");
        Client.Timeout = TimeSpan.FromSeconds(15);
    }

    [TearDown]
    public async Task Teardown()
    {
        Client?.Dispose();
        if (Factory is not null)
            await Factory.DisposeAsync();
    }

    private static void SetTestEnvironmentVariables()
    {
        Environment.SetEnvironmentVariable("APP_BASE_URL", "https://localhost:9000");
        Environment.SetEnvironmentVariable("AUTH_PUBLIC_ISSUER", "https://localhost:9000");
    }

    // ============================
    // ANTI-FORGERY HELPERS
    // ============================

    /// <summary>GET the page and extract __RequestVerificationToken + antiforgery cookie.</summary>
    protected async Task<AntiforgeryData> GetAntiforgeryData(string path)
    {
        var response = await Client.GetAsync(path);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(html);

        var cookie = ExtractSetCookieHeader(response, ".AspNetCore.Antiforgery");
        Assert.That(cookie, Is.Not.Null, "Could not find Antiforgery cookie in response");

        return new AntiforgeryData(token, cookie!);
    }

    /// <summary>Create a POST request with manually-injected antiforgery cookie.</summary>
    protected HttpRequestMessage CreatePostWithAntiforgery(string path, AntiforgeryData antiforgery, Dictionary<string, string> formData)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("Cookie", antiforgery.Cookie);
        request.Content = new FormUrlEncodedContent(
            formData.Append(new KeyValuePair<string, string>("__RequestVerificationToken", antiforgery.Token))
        );
        return request;
    }

    // ============================
    // GENERIC HTTP HELPERS
    // ============================

    protected async Task<string> GetStringAsync(string path)
    {
        var response = await Client.GetAsync(path);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        return await response.Content.ReadAsStringAsync();
    }

    protected HttpRequestMessage CreatePost(string path, Dictionary<string, string> formData, string? cookieHeader = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new FormUrlEncodedContent(formData)
        };
        if (cookieHeader is not null)
            request.Headers.Add("Cookie", cookieHeader);
        return request;
    }

    protected HttpRequestMessage CreateGet(string path, string? cookieHeader = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (cookieHeader is not null)
            request.Headers.Add("Cookie", cookieHeader);
        return request;
    }

    // ============================
    // RESPONSE PARSING HELPERS
    // ============================

    protected static string ExtractAntiforgeryToken(string html)
    {
        var m = Regex.Match(html,
            @"<input[^>]*name=""__RequestVerificationToken""[^>]*value=""([^""]+)""",
            RegexOptions.IgnoreCase);
        Assert.That(m.Success, Is.True, "Could not find __RequestVerificationToken in HTML");
        return m.Groups[1].Value;
    }

    /// <summary>
    /// Extract a cookie value (name=value only, no attributes) from Set-Cookie response headers.
    /// </summary>
    protected static string? ExtractSetCookieHeader(HttpResponseMessage response, string cookieName)
    {
        if (response.Headers.TryGetValues("Set-Cookie", out var values))
        {
            var full = values.FirstOrDefault(v =>
                v.StartsWith(cookieName, StringComparison.OrdinalIgnoreCase));
            if (full is null) return null;
            return full.Split(';')[0]; // strip attributes like path=, secure, httponly
        }
        return null;
    }

    protected static async Task<string> ExtractRedirectLocation(HttpResponseMessage response)
    {
        Assert.That(
            (int)response.StatusCode is >= 300 and < 400,
            Is.True,
            $"Expected redirect (3xx) but got {(int)response.StatusCode}");

        return response.Headers.Location?.ToString() ?? "";
    }

    protected static string ExtractQueryParam(string url, string param)
    {
        var qs = url.IndexOf('?');
        if (qs < 0) throw new AssertionException($"No query string in '{url}'");
        foreach (var pair in url[(qs + 1)..].Split('&'))
        {
            var eq = pair.IndexOf('=');
            if (eq > 0 && pair[..eq] == param)
                return Uri.UnescapeDataString(pair[(eq + 1)..]);
        }
        throw new AssertionException($"Query parameter '{param}' not found in '{url}'");
    }

    // ============================
    // OIDC HELPERS
    // ============================

    protected static string ComputeS256CodeChallenge(string codeVerifier)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hash = sha256.ComputeHash(System.Text.Encoding.ASCII.GetBytes(codeVerifier));
        return Convert.ToBase64String(hash)
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    protected record AntiforgeryData(string Token, string Cookie);
}
