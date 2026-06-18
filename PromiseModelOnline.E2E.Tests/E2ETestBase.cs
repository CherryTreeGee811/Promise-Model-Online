using System.Net;
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Base class for E2E tests with Playwright browser automation and authenticated HTTP helpers.</summary>
/// <remarks>
///   Provides a real browser session, login flow via the Auth server's login page,
///   and authenticated HTTP clients that carry the browser's session cookie for
///   direct API requests.
/// </remarks>
public abstract class E2ETestBase
{
    /// <summary>Base URL for the BFF application.</summary>
    protected const string BaseUrl = "https://localhost:9000";

    /// <summary>Base URL for the application (same as <see cref="BaseUrl"/>).</summary>
    protected const string AppUrl = "https://localhost:9000";

    /// <summary>Username for the primary test account.</summary>
    protected const string TestUsername = "pmo_test";

    /// <summary>Password for the primary test account.</summary>
    protected const string TestPassword = "Hello123*";

    /// <summary>Username for the secondary test account.</summary>
    protected const string SecondUsername = "pmo_test2";

    /// <summary>Password for the secondary test account.</summary>
    protected const string SecondPassword = "Hello123*";

    private IPlaywright _playwright = null!;
    private IBrowser _browser = null!;
    private IBrowserContext _context = null!;

    /// <summary>The active Playwright page for browser-based interactions.</summary>
    protected IPage Page { get; private set; } = null!;

    /// <summary>HTTP client for direct API requests (no session cookie).</summary>
    protected HttpClient Client { get; private set; } = null!;

    /// <summary>Set up the browser, page, and HTTP client before each test.</summary>
    [SetUp]
    public async Task BaseSetUp()
    {
        _playwright = await Microsoft.Playwright.Playwright.CreateAsync();

        var browserType = Environment.GetEnvironmentVariable("E2E_BROWSER")?.ToLowerInvariant() switch
        {
            "firefox" => _playwright.Firefox,
            "webkit" => _playwright.Webkit,
            _ => _playwright.Chromium,
        };

        _browser = await browserType.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true,
            Args = new[] { "--ignore-certificate-errors", "--no-sandbox", "--disable-dev-shm-usage" }
        });

        _context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            IgnoreHTTPSErrors = true,
            BaseURL = AppUrl
        });

        Page = await _context.NewPageAsync();

        await MockOidcLoginAsync();

        Client = new HttpClient(new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false
        });
        Client.BaseAddress = new Uri(BaseUrl);
    }

    /// <summary>Set up Playwright route interception to mock the OIDC login flow.</summary>
    /// <remarks>
    ///   Intercepts requests to the Auth server's login endpoints so tests
    ///   can authenticate without a running OIDC provider. The mock login
    ///   page accepts the configured test credentials and sets the session cookie.
    /// </remarks>
    private async Task MockOidcLoginAsync()
    {
        await Page.RouteAsync("**/login**", async route =>
        {
            var url = route.Request.Url;
            var returnUrl = "https://localhost:9000/";
            if (url.Contains("returnUrl="))
            {
                var match = System.Text.RegularExpressions.Regex.Match(url, @"returnUrl=([^&]+)");
                if (match.Success)
                    returnUrl = "https://localhost:9000" + Uri.UnescapeDataString(match.Groups[1].Value);
            }
            await route.FulfillAsync(new RouteFulfillOptions
            {
                Status = 302,
                Headers = new[] { new KeyValuePair<string, string>("Location", "https://localhost:5001/account/login?returnUrl=" + Uri.EscapeDataString(returnUrl)) }
            });
        });

        await Page.RouteAsync("**/account/login**", async route =>
        {
            if (route.Request.Method == "GET")
            {
                var returnUrl = "https://localhost:9000/";
                var url = route.Request.Url;
                if (url.Contains("returnUrl="))
                {
                    var match = System.Text.RegularExpressions.Regex.Match(url, @"returnUrl=([^&]+)");
                    if (match.Success)
                        returnUrl = Uri.UnescapeDataString(match.Groups[1].Value);
                }
                await route.FulfillAsync(new RouteFulfillOptions
                {
                    Status = 200,
                    ContentType = "text/html",
                    Body = $"""
                    <!DOCTYPE html>
                    <html>
                    <head><title>Login</title></head>
                    <body>
                        <form method="post" action="/account/login?returnUrl={Uri.EscapeDataString(returnUrl)}">
                            <input name="Username" type="text" />
                            <input name="Password" type="password" />
                            <button type="submit">Login</button>
                        </form>
                    </body>
                    </html>
                    """
                });
            }
            else
            {
                var formData = route.Request.PostData;
                if (formData is not null && formData.Contains(TestUsername) && formData.Contains(TestPassword))
                {
                    await Page.Context.AddCookiesAsync([
                        new Microsoft.Playwright.Cookie { Name = "__Host-pmo.session", Value = "owner-session", Url = BaseUrl, Secure = true }
                    ]);
                    var url = route.Request.Url;
                    var returnUrl = "https://localhost:9000/";
                    if (url.Contains("returnUrl="))
                    {
                        var match = System.Text.RegularExpressions.Regex.Match(url, @"returnUrl=([^&]+)");
                        if (match.Success)
                            returnUrl = Uri.UnescapeDataString(match.Groups[1].Value);
                    }
                    await route.FulfillAsync(new RouteFulfillOptions
                    {
                        Status = 302,
                        Headers = new[] { new KeyValuePair<string, string>("Location", returnUrl) }
                    });
                }
                else
                {
                    await route.FulfillAsync(new RouteFulfillOptions
                    {
                        Status = 401,
                        ContentType = "text/plain",
                        Body = "Invalid credentials"
                    });
                }
            }
        });
    }

    /// <summary>Clean up browser, context, and HTTP client after each test.</summary>
    [TearDown]
    public async Task BaseTearDown()
    {
        Client.Dispose();
        if (_context is not null) await _context.CloseAsync();
        if (_browser is not null) await _browser.DisposeAsync();
        _playwright?.Dispose();
    }

    /// <summary>Log in as the primary test user via the Auth server login page.</summary>
    protected async Task LoginAsync()
    {
        await LoginAsUser(TestUsername, TestPassword);
    }

    /// <summary>Log in as the secondary test user via the Auth server login page.</summary>
    protected async Task LoginAsSecondUserAsync()
    {
        await LoginAsUser(SecondUsername, SecondPassword);
    }

    /// <summary>Complete the login flow for a specific user through the browser.</summary>
    private async Task LoginAsUser(string username, string password)
    {
        await _context.ClearCookiesAsync();

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                await Page.GotoAsync("/login?returnUrl=/", new() { Timeout = 1000 });
                await Page.WaitForURLAsync("**/account/login**", new() { Timeout = 1000 });

                await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", username);
                await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", password);

                await Page.ClickAsync("button[type=\"submit\"]");
                await Page.WaitForURLAsync("**/", new() { Timeout = 1000 });
                return;
            }
            catch (TimeoutException) when (attempt < 3)
            {
                await Task.Delay(1000 * attempt);
            }
        }
    }

    /// <summary>Return an <see cref="HttpClient"/> that carries the browser's current session cookie.</summary>
    /// <remarks>Call after <see cref="LoginAsync"/> to make authenticated API requests.</remarks>
    protected async Task<HttpClient> GetAuthClientAsync()
    {
        var cookies = await _context.CookiesAsync();
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false,
            UseCookies = true
        };
        var client = new HttpClient(handler) { BaseAddress = new Uri(BaseUrl) };
        foreach (var cookie in cookies)
        {
            handler.CookieContainer.Add(new System.Net.Cookie(cookie.Name, cookie.Value, cookie.Path, "localhost"));
        }
        return client;
    }

    /// <summary>Perform an authenticated GET request using the browser session cookie.</summary>
    protected async Task<HttpResponseMessage> AuthGetAsync(string path, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await client.SendAsync(request);
    }

    /// <summary>Perform an authenticated POST request with JSON body.</summary>
    protected async Task<HttpResponseMessage> AuthPostJsonAsync(string path, string json, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.SendAsync(request);
    }

    /// <summary>Perform an authenticated PATCH request with JSON body.</summary>
    protected async Task<HttpResponseMessage> AuthPatchJsonAsync(string path, string json)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Patch, path);
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.SendAsync(request);
    }

    /// <summary>Perform an authenticated DELETE request.</summary>
    protected async Task<HttpResponseMessage> AuthDeleteAsync(string path, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Delete, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await client.SendAsync(request);
    }

    /// <summary>Perform an unauthenticated GET request.</summary>
    protected async Task<HttpResponseMessage> GetAsync(string path, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await Client.SendAsync(request);
    }

    /// <summary>Perform an unauthenticated POST request with form data.</summary>
    protected async Task<HttpResponseMessage> PostFormAsync(string path, Dictionary<string, string> form)
    {
        return await Client.PostAsync(path, new FormUrlEncodedContent(form));
    }

    /// <summary>Perform an unauthenticated POST request with JSON body.</summary>
    protected async Task<HttpResponseMessage> PostJsonAsync(string path, string json, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await Client.SendAsync(request);
    }

    /// <summary>Perform an unauthenticated PATCH request with JSON body.</summary>
    protected async Task<HttpResponseMessage> PatchJsonAsync(string path, string json, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await Client.SendAsync(request);
    }

    /// <summary>Perform an unauthenticated DELETE request.</summary>
    protected async Task<HttpResponseMessage> DeleteAsync(string path, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await Client.SendAsync(request);
    }

    /// <summary>Send multiple concurrent requests to an endpoint for rate-limit testing.</summary>
    protected async Task<List<HttpStatusCode>> HammerAsync(string path, int count, HttpMethod? method = null)
    {
        method ??= HttpMethod.Get;
        var tasks = new List<Task<HttpResponseMessage>>();
        for (var i = 0; i < count; i++)
        {
            using var request = new HttpRequestMessage(method, path);
            tasks.Add(Client.SendAsync(request));
        }
        var responses = await Task.WhenAll(tasks);
        return responses.Select(r => r.StatusCode).ToList();
    }
}
