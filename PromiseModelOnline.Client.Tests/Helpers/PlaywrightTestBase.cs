namespace PromiseModelOnline.Client.Tests.Helpers;

/// <summary>Base class for Playwright-based client UI tests.</summary>
/// <remarks>
///   Provides a shared browser instance across tests, automatic mock API interception
///   via <see cref="MockApiHandler"/>, session cookie management, and helper methods
///   for element interaction, navigation, and debugging.
/// </remarks>
public abstract class PlaywrightTestBase
{
    /// <summary>The active Playwright page for the current test.</summary>
    protected static IPage Page = null!;

    /// <summary>The browser context for cookie and session management.</summary>
    protected static IBrowserContext Context = null!;

    /// <summary>Base URL for the application, configurable via <c>TEST_BASE_URL</c> environment variable.</summary>
    protected string BaseUrl => Environment.GetEnvironmentVariable("TEST_BASE_URL") ?? "https://localhost:9000";

    /// <summary>Whether the browser should run headless, configurable via <c>HEADLESS</c> environment variable.</summary>
    protected static bool IsHeadless => string.Equals(Environment.GetEnvironmentVariable("HEADLESS") ?? "true", "true", StringComparison.OrdinalIgnoreCase);

    private static IPlaywright _playwright = null!;
    private static IBrowser _browser = null!;
    private static readonly SemaphoreSlim _initLock = new(1, 1);
    private static bool _initialized;

    /// <summary>Initialize the shared Playwright browser and page. Runs once per test run.</summary>
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

    /// <summary>Navigate to the app root and clear cookies before each test.</summary>
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

    /// <summary>Capture debug info (screenshot + HTML) on test failure.</summary>
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

    /// <summary>Ensure a valid session exists by navigating as a user.</summary>
    protected async Task EnsureLoggedIn(string targetPath = "/")
    {
        await NavigateAsUser(targetPath);
    }

    /// <summary>Set the BFF session cookie to simulate authentication.</summary>
    /// <param name="sessionValue">The session cookie value (e.g., "owner-session", "nonowner-session").</param>
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

    /// <summary>Navigate to a path with a simulated session cookie.</summary>
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

    /// <summary>Wait for a DOM selector to appear and return its locator.</summary>
    protected async Task<ILocator> WaitForSelectorAsync(string selector, int timeoutSeconds = 20)
    {
        var locator = Page.Locator(selector).First;
        await locator.WaitForAsync(new LocatorWaitForOptions { Timeout = timeoutSeconds * 1000 });
        return locator;
    }

    /// <summary>Click an element identified by CSS selector.</summary>
    protected async Task ClickAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = Page.Locator(selector);
        await locator.ScrollIntoViewIfNeededAsync();
        await locator.ClickAsync(new LocatorClickOptions { Timeout = timeoutSeconds * 1000 });
    }

    /// <summary>Get an attribute value from an element.</summary>
    protected async Task<string> GetAttributeAsync(string selector, string attribute, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.GetAttributeAsync(attribute) ?? "";
    }

    /// <summary>Get the text content of an element.</summary>
    protected async Task<string> GetTextContentAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.TextContentAsync() ?? "";
    }

    /// <summary>Check if an element is visible on the page.</summary>
    protected async Task<bool> IsVisibleAsync(string selector)
    {
        return await Page.Locator(selector).IsVisibleAsync();
    }

    /// <summary>Count elements matching a CSS selector.</summary>
    protected async Task<int> CountElementsAsync(string selector)
    {
        return await Page.Locator(selector).CountAsync();
    }

    /// <summary>Fill an input field with a value.</summary>
    protected async Task FillAsync(string selector, string value, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.FillAsync(value);
    }

    /// <summary>Select an option from a select element by its value.</summary>
    protected async Task SelectOptionByValueAsync(string selector, string value, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.SelectOptionAsync(new SelectOptionValue { Value = value });
    }

    /// <summary>Get the currently selected value of a select element.</summary>
    protected async Task<string> GetSelectedOptionValueAsync(string selector, int timeoutSeconds = 10)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.InputValueAsync();
    }

    /// <summary>Wait until a predicate returns true, with a timeout.</summary>
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

    /// <summary>Trigger an SPA navigation via pushState and popstate event.</summary>
    protected async Task NavigateSpaAsync(string path)
    {
        await Page.EvaluateAsync("p => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); }", path);
    }

    /// <summary>Wait for the page URL to contain a specific string.</summary>
    protected async Task<bool> WaitForUrlContainsAsync(string expected, int timeoutSeconds = 10)
    {
        return await WaitUntilAsync(() =>
            Task.FromResult(Page.Url.Contains(expected)), timeoutSeconds);
    }

    /// <summary>Click a navigation link by its element ID.</summary>
    protected async Task ClickNavLinkAsync(string linkId)
    {
        await ClickAsync($"#{linkId}");
    }

    /// <summary>Capture a screenshot and page HTML for debugging test failures.</summary>
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
