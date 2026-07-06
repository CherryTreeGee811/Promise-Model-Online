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

    /// <summary>Unique suffix for test data (username, email) to avoid collisions across runs.</summary>
    protected string UniqueSuffix { get; } = Guid.NewGuid().ToString("N");

    private IPlaywright _playwright = null!;
    private IBrowser _browser = null!;
    protected IBrowserContext _context = null!;

    /// <summary>The active Playwright page for browser-based interactions.</summary>
    protected IPage Page { get; private set; } = null!;

    /// <summary>HTTP client for direct API requests (no session cookie).</summary>
    protected HttpClient Client { get; private set; } = null!;

    /// <summary>Browser console errors captured during the test.</summary>
    protected List<string> ConsoleErrors { get; } = new();

    /// <summary>Set up the browser, page, and HTTP client before each test.</summary>
    [SetUp]
    public async Task BaseSetUp()
    {
        _playwright = await Microsoft.Playwright.Playwright.CreateAsync();

        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true,
            Args = new[] { "--ignore-certificate-errors", "--no-sandbox", "--disable-dev-shm-usage", "--host-resolver-rules=MAP localhost 127.0.0.1" },
        });

        _context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            IgnoreHTTPSErrors = true,
            BaseURL = AppUrl
        });

        Page = await _context.NewPageAsync();

        // Clear service worker cache so tests load fresh JS/CSS assets
        try
        {
            await Page.GotoAsync(BaseUrl, new() { WaitUntil = WaitUntilState.DOMContentLoaded, Timeout = 5000 });
            await Page.EvaluateAsync(@"() => {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(r => r.forEach(r => r.unregister()));
                }
                if ('caches' in window) {
                    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                }
            }");
        }
        catch
        {
            // Ignore — SW cleanup is best-effort
        }

        ConsoleErrors.Clear();
        Page.Console += (_, msg) =>
        {
            if (msg.Type == "error" || msg.Type == "warning")
                ConsoleErrors.Add($"[{msg.Type}] {msg.Text}");
        };

        Client = new HttpClient(new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false
        });
        Client.BaseAddress = new Uri(BaseUrl);
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

    /// <summary>Inject all session cookie chunks into the browser context via JavaScript.</summary>
    /// <remarks>
    ///   Uses <c>document.cookie</c> because Playwright's <c>AddCookiesAsync</c> requires a
    ///   Domain attribute, which is forbidden for <c>__Host-</c> prefix cookies.
    /// </remarks>
    private async Task InjectSessionCookiesAsync(IReadOnlyDictionary<string, string>? chunks)
    {
        if (chunks is null) return;
        foreach (var chunk in chunks)
            await Page.EvaluateAsync($"document.cookie = '{chunk.Key}={chunk.Value}; path=/; secure; samesite=lax'");
    }

    /// <summary>Build a semicolon-separated Cookie header value from session cookie chunks.</summary>
    private static string? BuildCookieHeader(IReadOnlyDictionary<string, string>? chunks)
        => chunks?.Select(c => $"{c.Key}={c.Value}") is IEnumerable<string> parts
            ? string.Join("; ", parts)
            : null;

    /// <summary>Authenticate via pre-captured session cookie (fast). Falls back to real browser login if cookie not available.</summary>
    protected async Task LoginAsync()
    {
        if (GlobalSetUp.OwnerSessionChunks is not null)
        {
            _currentSessionChunks = GlobalSetUp.OwnerSessionChunks;
            await _context.ClearCookiesAsync();
            try
            {
                await Page.GotoAsync(BaseUrl, new() { WaitUntil = WaitUntilState.Load });
            }
            catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED"))
            {
            }
            await Page.WaitForSelectorAsync("#content", new() { Timeout = 5000 });
            await InjectSessionCookiesAsync(_currentSessionChunks);
            return;
        }
        _currentSessionChunks = null;
        await LoginAsUser(TestUsername, TestPassword);
    }

    /// <summary>Authenticate as second user via pre-captured session cookie (fast). Falls back to real browser login if cookie not available.</summary>
    protected async Task LoginAsSecondUserAsync()
    {
        if (GlobalSetUp.SecondUserSessionChunks is not null)
        {
            _currentSessionChunks = GlobalSetUp.SecondUserSessionChunks;
            await _context.ClearCookiesAsync();
            try
            {
                await Page.GotoAsync(BaseUrl, new() { WaitUntil = WaitUntilState.Load });
            }
            catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED"))
            {
            }
            await Page.WaitForSelectorAsync("#content", new() { Timeout = 5000 });
            await InjectSessionCookiesAsync(_currentSessionChunks);
            return;
        }
        _currentSessionChunks = null;
        await LoginAsUser(SecondUsername, SecondPassword);
    }

    private static readonly System.Text.RegularExpressions.Regex LoginPagePattern = new("account/login|connect/authorize", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    private static readonly System.Text.RegularExpressions.Regex AppHomePattern = new(@"^https://localhost:\d+/(\?.*)?$|/projects", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    /// <summary>Complete the full login flow (Auth server + BFF OIDC) for a specific user through the browser.</summary>
    /// <remarks>
    ///   Step 1: Navigates to <c>/account/login</c> (Auth server) and authenticates, setting <c>__Host-pmo.auth</c>.
    ///   Step 2: Navigates to <c>/login</c> (BFF) to trigger the OIDC challenge, which uses the existing
    ///           <c>__Host-pmo.auth</c> to auto-authorize and create the BFF session cookie <c>__Host-pmo.session</c>.
    ///   Captures all cookies from the browser context after successful login.
    /// </remarks>
    protected async Task LoginAsUser(string username, string password)
    {
        await _context.ClearCookiesAsync();

        // Reset Identity lockout before attempting login
        try
        {
            using var unlockClient = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                AllowAutoRedirect = false
            })
            { BaseAddress = new Uri(BaseUrl) };
            await unlockClient.PostAsync(
                $"/account/dev/reset-lockout?username={Uri.EscapeDataString(username)}&password={Uri.EscapeDataString(password)}",
                null);
        }
        catch { }

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                // Step 1: Auth server login → sets __Host-pmo.auth
                await Page.GotoAsync("/account/login", new() { Timeout = 5000, WaitUntil = WaitUntilState.Load });

                Console.WriteLine($"LoginAsUser URL: {Page.Url}");

                await Page.Locator("#Username").FillAsync(username);
                await Page.Locator("#Password").FillAsync(password);

                await Page.ClickAsync("button[type=\"submit\"]");

                await Page.WaitForURLAsync(AppHomePattern, new() { Timeout = 5000 });

                // Step 2: Complete the OIDC flow so the BFF creates __Host-pmo.session
                await Page.GotoAsync("/login?returnUrl=/", new() { Timeout = 5000 });
                await Page.WaitForURLAsync(AppHomePattern, new() { Timeout = 5000 });

                break;
            }
            catch (TimeoutException) when (attempt < 3)
            {
                var body = await Page.TextContentAsync("body") ?? "";
                if (body.Contains("locked", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        using var unlockClient = new HttpClient(new HttpClientHandler
                        {
                            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                            AllowAutoRedirect = false
                        })
                        { BaseAddress = new Uri(BaseUrl) };
                        await unlockClient.PostAsync(
                            $"/account/dev/reset-lockout?username={Uri.EscapeDataString(username)}&password={Uri.EscapeDataString(password)}",
                            null);
                    }
                    catch { }
                }
                await Page.ReloadAsync(new() { Timeout = 5000 });
                await Task.Delay(5000);
            }
        }

        var cookies = await _context.CookiesAsync();
        _currentSessionChunks = cookies.Count > 0
            ? cookies.ToDictionary(c => c.Name, c => c.Value)
            : null;
    }

    private IReadOnlyDictionary<string, string>? _currentSessionChunks;
    /// <summary>Send an authenticated HTTP request with the pre-captured session cookie (direct header, no CookieContainer).</summary>
    private async Task<HttpResponseMessage> SendWithSessionCookieAsync(HttpMethod method, string path, string? json, bool ajax)
    {
        var chunks = _currentSessionChunks ?? GlobalSetUp.OwnerSessionChunks;
        using var request = new HttpRequestMessage(method, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        if (json is not null)
            request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var cookieHeader = BuildCookieHeader(chunks);
        if (cookieHeader is not null)
        {
            var added = request.Headers.TryAddWithoutValidation("Cookie", cookieHeader);
            if (!added)
                throw new InvalidOperationException("TryAddWithoutValidation returned false for Cookie header!");
        }
        using var hc = new HttpClient(new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false,
            UseCookies = false
        })
        { BaseAddress = new Uri(BaseUrl) };
        return await hc.SendAsync(request);
    }

    /// <summary>Return an <see cref="HttpClient"/> that carries the pre-captured session cookie chunks.</summary>
    /// <remarks>Call after <see cref="LoginAsync"/> to make authenticated API requests.</remarks>
    protected async Task<HttpClient> GetAuthClientAsync()
    {
        var chunks = _currentSessionChunks ?? GlobalSetUp.OwnerSessionChunks;
        if (chunks is not null)
        {
            var cl = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                AllowAutoRedirect = false,
                UseCookies = false
            })
            { BaseAddress = new Uri(BaseUrl) };
            var cookieHeader = BuildCookieHeader(chunks);
            if (cookieHeader is not null)
                cl.DefaultRequestHeaders.TryAddWithoutValidation("Cookie", cookieHeader);
            return cl;
        }
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false,
            UseCookies = true
        };
        var cl2 = new HttpClient(handler) { BaseAddress = new Uri(BaseUrl) };
        var cookies = await _context.CookiesAsync();
        if (cookies.Count == 0)
            Assert.Fail("No cookies found in browser context — cookie injection may have failed");
        foreach (var ck in cookies)
        {
            handler.CookieContainer.Add(new System.Net.Cookie(ck.Name, ck.Value, ck.Path, ck.Domain ?? "localhost")
            {
                Secure = ck.Secure
            });
        }
        return cl2;
    }

    /// <summary>Perform an authenticated GET request using the browser session cookie.</summary>
    protected Task<HttpResponseMessage> AuthGetAsync(string path, bool ajax = false)
        => SendWithSessionCookieAsync(HttpMethod.Get, path, null, ajax);

    /// <summary>Perform an authenticated POST request with JSON body.</summary>
    protected Task<HttpResponseMessage> AuthPostJsonAsync(string path, string json, bool ajax = false)
        => SendWithSessionCookieAsync(HttpMethod.Post, path, json, ajax);

    /// <summary>Perform an authenticated PATCH request with JSON body.</summary>
    protected Task<HttpResponseMessage> AuthPatchJsonAsync(string path, string json)
        => SendWithSessionCookieAsync(HttpMethod.Patch, path, json, false);

    /// <summary>Perform an authenticated DELETE request.</summary>
    protected Task<HttpResponseMessage> AuthDeleteAsync(string path, bool ajax = false)
        => SendWithSessionCookieAsync(HttpMethod.Delete, path, null, ajax);

    /// <summary>Perform an unauthenticated GET request.</summary>
    protected async Task<HttpResponseMessage> GetAsync(string path, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await Client.SendAsync(request);
    }

    /// <summary>Perform an unauthenticated POST request with form data.</summary>
    protected async Task<HttpResponseMessage> PostFormAsync(string path, Dictionary<string, string> form) => await Client.PostAsync(path, new FormUrlEncodedContent(form));

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

    /// <summary>Navigate and force Playwright cookie-store sync after navigation.</summary>
    /// <remarks>
    ///   Clears any stale <c>.AspNetCore.Antiforgery</c> cookie before navigating so the
    ///   server generates a fresh cookie + form-token pair in a single response, eliminating
    ///   the anti-CSRF race where a prior cookie value mismatches the form token on POST.
    /// </remarks>
    protected async Task NavigateForFormAsync(string url, int timeout = 5000)
    {
        await _context.ClearCookiesAsync(new() { Name = ".AspNetCore.Antiforgery" });
        await Page.GotoAsync(url, new() { WaitUntil = WaitUntilState.Load, Timeout = timeout });
        await _context.CookiesAsync();
    }

    /// <summary>Wait for redirect to login (either /login, /account/login, or /connect/authorize).</summary>
    protected async Task WaitForLoginRedirectAsync(int timeout = 5000)
    {
        var regex = new System.Text.RegularExpressions.Regex("login|connect/authorize");
        await Page.WaitForURLAsync(regex, new() { Timeout = timeout });
    }

    /// <summary>Navigate to a URL and wait for redirect to login.</summary>
    protected async Task GotoAndWaitForLoginRedirectAsync(string url, int timeout = 5000)
    {
        try
        {
            await Page.GotoAsync(url, new() { WaitUntil = WaitUntilState.Load, Timeout = timeout });
        }
        catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED"))
        {
        }
        try
        {
            var regex = new System.Text.RegularExpressions.Regex("login|connect/authorize");
            await Page.WaitForURLAsync(regex, new() { Timeout = timeout });
        }
        catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED"))
        {
        }
        catch (TimeoutException)
        {
            var hasForm = await Page.Locator("#Username").CountAsync() > 0;
            if (!hasForm)
                throw;
        }
    }

    /// <summary>Assert no CSP violations were reported by the browser during the test.</summary>
    protected void AssertNoCspViolations()
    {
        var cspViolations = ConsoleErrors
            .Where(e => e.Contains("Content-Security-Policy") || e.Contains("CSP") || e.Contains("violat"))
            .ToList();
        if (cspViolations.Count > 0)
            Assert.Fail($"CSP violations detected:\n{string.Join("\n", cspViolations)}");
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
