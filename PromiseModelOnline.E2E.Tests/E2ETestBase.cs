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
        await Page.GotoAsync("/login?returnUrl=/");
        await Page.WaitForURLAsync("**/account/login**");

        await Page.FillAsync("input[name=\"Username\"],input[name=\"username\"]", TestUsername);
        await Page.FillAsync("input[name=\"Password\"],input[name=\"password\"]", TestPassword);

        await Page.ClickAsync("button[type=\"submit\"]");

        await Page.WaitForURLAsync("**/");
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
