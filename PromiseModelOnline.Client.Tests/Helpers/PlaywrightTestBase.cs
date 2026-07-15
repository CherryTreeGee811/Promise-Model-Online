using System.Text.Json;

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

            var browserType = Environment.GetEnvironmentVariable("TEST_BROWSER")?.ToLowerInvariant() switch
            {
                "firefox" => _playwright.Firefox,
                "webkit" => _playwright.Webkit,
                _ => _playwright.Chromium,
            };

            var browserName = Environment.GetEnvironmentVariable("TEST_BROWSER")?.ToLowerInvariant() ?? "chromium";
            var launchArgs = browserName switch
            {
                "firefox" => new[] { "--no-sandbox" },
                "webkit" => Array.Empty<string>(),
                _ => new[] { "--ignore-certificate-errors", "--no-sandbox", "--disable-dev-shm-usage", "--disable-web-security", "--allow-running-insecure-content" },
            };

            _browser = await browserType.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = IsHeadless,
                Args = launchArgs,
            });

            Context = await _browser.NewContextAsync(new BrowserNewContextOptions
            {
                IgnoreHTTPSErrors = true,
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 }
            });

            Page = await Context.NewPageAsync();

            Page.Console += (_, e) =>
            {
                // Filter out expected SignalR noise (no SignalR hub in test environment)
                if (e.Text.Contains("signalr", StringComparison.OrdinalIgnoreCase)
                    || e.Text.Contains("Failed to start the connection", StringComparison.OrdinalIgnoreCase)
                    || e.Text.Contains("None of the transports", StringComparison.OrdinalIgnoreCase)
                    || e.Text.Contains("transports supported", StringComparison.OrdinalIgnoreCase)
                    || e.Text.Contains("negotiation with the server", StringComparison.OrdinalIgnoreCase)
                    || e.Text.Contains("/umami/", StringComparison.OrdinalIgnoreCase)
                    || (e.Text.Contains("Failed to load resource", StringComparison.OrdinalIgnoreCase)
                        && (e.Text.Contains("404", StringComparison.OrdinalIgnoreCase)
                            || e.Text.Contains("401", StringComparison.OrdinalIgnoreCase))))
                    return;

                if (e.Type == "error" || e.Type == "warning")
                    TestContext.Progress.WriteLine($"[BROWSER {e.Type}] {e.Text}");
            };

            Page.PageError += (_, error) =>
            {
                TestContext.Progress.WriteLine($"[PAGE ERROR] {error}");
            };

            await Page.RouteAsync("**/*", MockApiHandler.HandleRouteAsync);
            await Context.RouteAsync("**/*", MockApiHandler.HandleRouteAsync);

            await Page.GotoAsync(BaseUrl + "/");
            await PopulateSwCacheAsync();
            _initialized = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    /// <summary>Clear state, then navigate to the app root before each test.</summary>
    [SetUp]
    public async Task Setup()
    {
        // Layer 1: Clear state BEFORE navigation so the SPA loads into a clean session
        await Context.ClearCookiesAsync();
        MockApiHandler.SetSessionValue(null);

        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 10000 });
                break;
            }
            catch (TimeoutException) when (attempt < 2)
            {
                await Task.Delay(500);
            }
            catch (PlaywrightException ex) when (attempt < 2 && (
                ex.Message.Contains("ERR_ABORTED") ||
                ex.Message.Contains("NS_BINDING_ABORTED") ||
                ex.Message.Contains("NS_ERROR_FAILURE") ||
                ex.Message.Contains("NS_ERROR_NETONRESET") ||
                ex.Message.Contains("Download is starting") ||
                ex.Message.Contains("interrupted by another navigation")))
            {
                // Layer 2: Navigation was interrupted (e.g. SPA redirect). Wait for the
                // redirected page to settle instead of starting a fresh navigation.
                await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
                break;
            }
        }
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
    protected async Task EnsureLoggedIn(string targetPath = "/") => await NavigateAsUser(targetPath);

    /// <summary>Set the BFF session cookie to simulate authentication.</summary>
    /// <param name="sessionValue">The session cookie value (e.g., "owner-session", "nonowner-session").</param>
    /// <remarks>
    ///   Sets both the real <c>__Host-</c> prefixed cookie (for Chromium/Firefox)
    ///   and a non-prefixed fallback <c>pmo.session</c> (for WebKit, which may reject
    ///   <c>__Host-</c> cookies when Playwright adds a Domain attribute).
    ///   Also stores the session value in <see cref="MockApiHandler"/> as a fallback
    ///   for browsers where Playwright route interception does not expose the Cookie header.
    /// </remarks>
    protected async Task SetSessionCookie(string sessionValue = "owner-session")
    {
        MockApiHandler.SetSessionValue(sessionValue);

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

        try
        {
            var value = $"pmo.session={sessionValue}; path=/; secure";
            await Page.EvaluateAsync($"document.cookie = '{value}'");
        }
        catch
        {
            await Context.AddCookiesAsync([
                new Cookie { Name = "pmo.session", Value = sessionValue, Url = "https://localhost:9000/", Secure = true }
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
                await Page.GotoAsync(BaseUrl + path, new PageGotoOptions { Timeout = 2000 });
                return;
            }
            catch (PlaywrightException ex) when (attempt < 2 && (ex.Message.Contains("ERR_ABORTED") || ex.Message.Contains("interrupted by another navigation")))
            {
                await Task.Delay(100);
            }
            catch (TimeoutException) when (attempt < 2)
            {
                await Task.Delay(100);
            }
        }
    }

    /// <summary>Wait for a DOM selector to appear and return its locator.</summary>
    protected async Task<ILocator> WaitForSelectorAsync(string selector, int timeoutSeconds = 2)
    {
        var locator = Page.Locator(selector).First;
        await locator.WaitForAsync(new LocatorWaitForOptions { Timeout = timeoutSeconds * 1000 });
        return locator;
    }

    /// <summary>Click an element identified by CSS selector.</summary>
    protected async Task ClickAsync(string selector, int timeoutSeconds = 2)
    {
        var locator = Page.Locator(selector);
        await locator.ScrollIntoViewIfNeededAsync();
        await locator.ClickAsync(new LocatorClickOptions { Timeout = timeoutSeconds * 1000 });
    }

    /// <summary>Get an attribute value from an element.</summary>
    protected async Task<string> GetAttributeAsync(string selector, string attribute, int timeoutSeconds = 2)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.GetAttributeAsync(attribute) ?? "";
    }

    /// <summary>Get the text content of an element.</summary>
    protected async Task<string> GetTextContentAsync(string selector, int timeoutSeconds = 2)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.TextContentAsync() ?? "";
    }

    /// <summary>Check if an element is visible on the page.</summary>
    protected async Task<bool> IsVisibleAsync(string selector) => await Page.Locator(selector).IsVisibleAsync();

    /// <summary>Count elements matching a CSS selector.</summary>
    protected async Task<int> CountElementsAsync(string selector) => await Page.Locator(selector).CountAsync();

    /// <summary>Fill an input field with a value.</summary>
    protected async Task FillAsync(string selector, string value, int timeoutSeconds = 2)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.FillAsync(value);
    }

    /// <summary>Select an option from a select element by its value.</summary>
    protected async Task SelectOptionByValueAsync(string selector, string value, int timeoutSeconds = 2)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        await locator.SelectOptionAsync(new SelectOptionValue { Value = value });
    }

    /// <summary>Get the currently selected value of a select element.</summary>
    protected async Task<string> GetSelectedOptionValueAsync(string selector, int timeoutSeconds = 2)
    {
        var locator = await WaitForSelectorAsync(selector, timeoutSeconds);
        return await locator.InputValueAsync();
    }

    /// <summary>Wait until a predicate returns true, with a timeout.</summary>
    protected async Task<bool> WaitUntilAsync(Func<Task<bool>> predicate, int timeoutSeconds = 2)
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
            await Task.Delay(100);
        }
        return false;
    }

    /// <summary>Trigger an SPA navigation via pushState and popstate event.</summary>
    protected async Task NavigateSpaAsync(string path) => await Page.EvaluateAsync("p => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); }", path);

    /// <summary>Wait for the page URL to contain a specific string.</summary>
    protected async Task<bool> WaitForUrlContainsAsync(string expected, int timeoutSeconds = 2) => await WaitUntilAsync(() =>
                                                                                                            Task.FromResult(Page.Url.Contains(expected)), timeoutSeconds);

    /// <summary>Click a navigation link by its element ID.</summary>
    protected async Task ClickNavLinkAsync(string linkId) => await ClickAsync($"#{linkId}");

    /// <summary>Pre-populate the service worker cache from local files.</summary>
    /// <remarks>
    ///   Works in all browsers. Uses the page context's fetch() (which goes through
    ///   Playwright route interception with IgnoreHTTPSErrors) to populate the SW's
    ///   cache, bypassing Firefox's SW-scope fetch() limitation with self-signed certs.
    ///   The SW's install handler is also resilient to individual precache failures,
    ///   so activation always proceeds even when SW-scope fetch() fails.
    /// </remarks>
    private async Task PopulateSwCacheAsync()
    {
        var swPath = Path.Combine(GetWwwRoot(), "sw.mjs");
        if (!File.Exists(swPath)) return;

        var swContent = File.ReadAllText(swPath);

        // Extract the SW's cache name from the source (default: 'pmo-v6')
        var cacheName = "pmo-v6";
        var cacheMatch = System.Text.RegularExpressions.Regex.Match(swContent, @"const CACHE\s*=\s*'([^']+)'");
        if (cacheMatch.Success)
            cacheName = cacheMatch.Groups[1].Value;

        // Extract the PRECACHE array from the SW source
        var start = swContent.IndexOf("PRECACHE = [", StringComparison.Ordinal);
        start = swContent.IndexOf('[', start);
        var end = swContent.IndexOf(']', start);
        var arrayContent = swContent[start..(end + 1)];
        var json = arrayContent.Replace('\'', '"').Replace(",]", "]");
        var precacheEntries = JsonSerializer.Deserialize<string[]>(json) ?? [];
        if (precacheEntries.Length == 0) return;

        // Fetch each PRECACHE entry from the page context and store in the SW cache.
        // Page-context fetch() uses Playwright's IgnoreHTTPSErrors, so it succeeds
        // in all browsers (including Firefox where SW-scope fetch fails on self-signed
        // certs). Real HTTP Response objects also satisfy Firefox's font/image engines.
        var baseUrl = BaseUrl;
        await Page.EvaluateAsync<object?>(@"
            (precacheJson => {
                const urls = JSON.parse(precacheJson);
                return caches.open('" + cacheName + @"').then(async cache => {
                    await Promise.all(urls.map(async (url) => {
                        try {
                            const response = await fetch(url);
                            if (response.ok) await cache.put(url, response);
                        } catch (e) {
                            // Entry may not exist in test environment
                        }
                    }));
                });
            })
        ", System.Text.Json.JsonSerializer.Serialize(precacheEntries));

        // Wait up to 5s for the SW to register and activate.
        // The SW's install handler is now resilient — activation always proceeds
        // even when individual precache fetches fail (e.g. Firefox + self-signed certs).
        for (var i = 0; i < 10; i++)
        {
            var swReady = await Page.EvaluateAsync<bool>(@"
                navigator.serviceWorker.getRegistration().then(r =>
                    r !== undefined && r.active !== null
                )");
            if (swReady)
            {
                // Signal the SW that the cache is pre-populated
                await Page.EvaluateAsync(@"
                    navigator.serviceWorker.getRegistration().then(r => {
                        if (r && r.active) r.active.postMessage({ type: 'CACHE_READY' });
                    })");
                break;
            }
            await Task.Delay(500);
        }
    }

    private static string GetWwwRoot() => Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..",
        "PromiseModelOnline.Client", "wwwroot"));

    /// <summary>Capture a screenshot and page HTML for debugging test failures.</summary>
    private async Task DumpDebugInfoAsync()
    {
        try
        {
            var screenshotPath = Path.Combine(Path.GetTempPath(), $"playwright-failure-{Guid.NewGuid()}.png");
            await Page.ScreenshotAsync(new PageScreenshotOptions { Path = screenshotPath, FullPage = true, Timeout = 2000 });
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
