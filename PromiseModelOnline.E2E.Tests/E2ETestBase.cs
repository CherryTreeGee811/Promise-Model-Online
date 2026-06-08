using System.Net;
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace PromiseModelOnline.E2E.Tests;

public abstract class E2ETestBase
{
    protected const string BaseUrl = "https://localhost:9000";
    protected const string AppUrl = "https://localhost:9000";
    protected const string TestUsername = "pmo_test";
    protected const string TestPassword = "Hello123*";
    protected const string SecondUsername = "pmo_test2";
    protected const string SecondPassword = "Hello123*";

    private IPlaywright _playwright = null!;
    private IBrowser _browser = null!;
    private IBrowserContext _context = null!;

    protected IPage Page { get; private set; } = null!;
    protected HttpClient Client { get; private set; } = null!;

    [SetUp]
    public async Task BaseSetUp()
    {
        _playwright = await Microsoft.Playwright.Playwright.CreateAsync();

        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
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

        Client = new HttpClient(new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
            AllowAutoRedirect = false
        });
        Client.BaseAddress = new Uri(BaseUrl);
    }

    [TearDown]
    public async Task BaseTearDown()
    {
        Client.Dispose();
        if (_context is not null) await _context.CloseAsync();
        if (_browser is not null) await _browser.DisposeAsync();
        _playwright?.Dispose();
    }

    protected async Task LoginAsync()
    {
        await LoginAsUser(TestUsername, TestPassword);
    }

    protected async Task LoginAsSecondUserAsync()
    {
        await LoginAsUser(SecondUsername, SecondPassword);
    }

    private async Task LoginAsUser(string username, string password)
    {
        // Clear any existing session so the BFF challenges via OIDC
        await _context.ClearCookiesAsync();

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                await Page.GotoAsync("/login?returnUrl=/", new() { Timeout = 15000 });
                await Page.WaitForURLAsync("**/account/login**", new() { Timeout = 15000 });

                await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", username);
                await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", password);

                await Page.ClickAsync("button[type=\"submit\"]");
                await Page.WaitForURLAsync("**/", new() { Timeout = 30000 });
                return;
            }
            catch (TimeoutException) when (attempt < 3)
            {
                await Task.Delay(30000 * attempt);
            }
        }
    }

    /// <summary>
    /// Returns an HttpClient that carries the browser's current session cookie.
    /// Call after LoginAsync() to make authenticated API requests.
    /// </summary>
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

    protected async Task<HttpResponseMessage> AuthGetAsync(string path, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> AuthPostJsonAsync(string path, string json, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> AuthPatchJsonAsync(string path, string json)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Patch, path);
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> AuthDeleteAsync(string path, bool ajax = false)
    {
        using var client = await GetAuthClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Delete, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> GetAsync(string path, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await Client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> PostFormAsync(string path, Dictionary<string, string> form)
    {
        return await Client.PostAsync(path, new FormUrlEncodedContent(form));
    }

    protected async Task<HttpResponseMessage> PostJsonAsync(string path, string json, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await Client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> PatchJsonAsync(string path, string json, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await Client.SendAsync(request);
    }

    protected async Task<HttpResponseMessage> DeleteAsync(string path, bool ajax = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, path);
        if (ajax) request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        return await Client.SendAsync(request);
    }

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
