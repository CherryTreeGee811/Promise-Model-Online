namespace PromiseModelOnline.Client.Tests.Helpers;

public abstract class PlaywrightTestBase
{
    protected static IPage Page = null!;
    protected static IBrowserContext Context = null!;
    protected string BaseUrl => Environment.GetEnvironmentVariable("TEST_BASE_URL") ?? "https://localhost:9000";
    protected static bool IsHeadless => string.Equals(Environment.GetEnvironmentVariable("HEADLESS") ?? "true", "true", StringComparison.OrdinalIgnoreCase);

    private static IPlaywright _playwright = null!;
    private static IBrowser _browser = null!;
    private static readonly SemaphoreSlim _initLock = new(1, 1);
    private static bool _initialized;

    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        if (_initialized) return;
        await _initLock.WaitAsync();
        try
        {
            if (_initialized) return;

            _playwright = await Microsoft.Playwright.Playwright.CreateAsync();
            _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = IsHeadless,
                Args = new[]
                {
                    "--ignore-certificate-errors",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-web-security",
                    "--allow-running-insecure-content"
                }
            });

            Context = await _browser.NewContextAsync(new BrowserNewContextOptions
            {
                IgnoreHTTPSErrors = true,
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 }
            });

            Page = await Context.NewPageAsync();

            Page.Console += (_, e) =>
            {
                if (e.Type == "error" || e.Type == "warning")
                    TestContext.Progress.WriteLine($"[BROWSER {e.Type}] {e.Text}");
            };

            Page.PageError += (_, error) =>
            {
                TestContext.Progress.WriteLine($"[PAGE ERROR] {error}");
            };

            await Page.RouteAsync(url => !url.StartsWith("https://cdn.jsdelivr.net"), MockApiHandler.HandleRouteAsync);

            await Page.GotoAsync(BaseUrl + "/");
            _initialized = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    [SetUp]
    public async Task Setup()
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 15000 });
                break;
            }
            catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED") || ex.Message.Contains("interrupted by another navigation"))
            {
                if (attempt == 2) throw;
                await Task.Delay(1000);
            }
        }
        await Context.ClearCookiesAsync();
        await Page.SetViewportSizeAsync(1280, 720);
    }

    [TearDown]
    public async Task TearDown()
    {
        try
        {
            if (TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Failed)
                await DumpDebugInfoAsync();
        }
        catch { }
    }

    /*
    ====================================
    AUTH
    ====================================
    */

    protected async Task EnsureLoggedIn(string targetPath = "/")
    {
        await NavigateAsUser(targetPath);
    }

    protected async Task SetSessionCookie(string sessionValue = "owner-session")
    {
        try
        {
            await Page.EvaluateAsync($"document.cookie = '__Host-pmo.session={sessionValue}; path=/; secure'");
        }
        catch
        {
            await Context.AddCookiesAsync([
                new Cookie { Name = "__Host-pmo.session", Value = sessionValue, Url = "https://localhost:9000/", Secure = true }
            ]);
        }
    }

    protected async Task NavigateAsUser(string path, string sessionValue = "owner-session")
    {
        await SetSessionCookie(sessionValue);
        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                await Page.GotoAsync(BaseUrl + path, new PageGotoOptions { Timeout = 15000 });
                return;
            }
            catch (PlaywrightException ex) when (ex.Message.Contains("ERR_ABORTED") || ex.Message.Contains("interrupted by another navigation"))
            {
                if (attempt == 2) throw;
                await Task.Delay(1000);
            }
        }
    }

    /*
    ====================================
    ELEMENT HELPERS
    ====================================
    */

    protected async Task<ILocator> WaitForSelectorAsync(string selector, int timeoutSeconds = 20)
    {
        var locator = Page.Locator(selector).First;
        await locator.WaitForAsync(new LocatorWaitForOptions { Timeout = timeoutSeconds * 1000 });
        return locator;
    }

    protected async Task ClickAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = Page.Locator(selector);
        await locator.ScrollIntoViewIfNeededAsync();
        await locator.ClickAsync(new LocatorClickOptions { Timeout = timeoutSeconds * 1000 });
    }

    protected async Task<string> GetAttributeAsync(string selector, string attribute, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.GetAttributeAsync(attribute) ?? "";
    }

    protected async Task<string> GetTextContentAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.TextContentAsync() ?? "";
    }

    protected async Task<bool> IsVisibleAsync(string selector)
    {
        return await Page.Locator(selector).IsVisibleAsync();
    }

    protected async Task<int> CountElementsAsync(string selector)
    {
        return await Page.Locator(selector).CountAsync();
    }

    protected async Task FillAsync(string selector, string value, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.FillAsync(value);
    }

    protected async Task SelectOptionByValueAsync(string selector, string value, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.SelectOptionAsync(new SelectOptionValue { Value = value });
    }

    protected async Task<string> GetSelectedOptionValueAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.InputValueAsync();
    }

    protected async Task<bool> WaitUntilAsync(Func<Task<bool>> predicate, int timeoutSeconds = 10)
    {
        var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
        while (DateTime.UtcNow < deadline)
        {
            try
            {
                if (await predicate())
                    return true;
            }
            catch { }
            await Task.Delay(200);
        }
        return false;
    }

    /*
    ====================================
    SPA NAVIGATION
    ====================================
    */

    protected async Task NavigateSpaAsync(string path)
    {
        await Page.EvaluateAsync("p => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); }", path);
    }

    protected async Task<bool> WaitForUrlContainsAsync(string expected, int timeoutSeconds = 10)
    {
        return await WaitUntilAsync(() =>
            Task.FromResult(Page.Url.Contains(expected)), timeoutSeconds);
    }

    /*
    ====================================
    NAVIGATION HELPERS
    ====================================
    */

    protected async Task ClickNavLinkAsync(string linkId)
    {
        await ClickAsync($"#{linkId}");
    }

    /*
    ====================================
    DEBUG HELPERS
    ====================================
    */

    private async Task DumpDebugInfoAsync()
    {
        try
        {
            var screenshotPath = Path.Combine(Path.GetTempPath(), $"playwright-failure-{Guid.NewGuid()}.png");
            await Page.ScreenshotAsync(new PageScreenshotOptions { Path = screenshotPath, FullPage = true });
            TestContext.Progress.WriteLine($"Screenshot saved to: {screenshotPath}");

            var html = await Page.ContentAsync();
            TestContext.Progress.WriteLine("----- PAGE HTML (truncated 10000 chars) -----");
            TestContext.Progress.WriteLine(html.Length > 10000 ? html[..10000] : html);
        }
        catch (Exception e)
        {
            TestContext.Progress.WriteLine($"(failed diagnostics: {e.Message})");
        }
    }
}
