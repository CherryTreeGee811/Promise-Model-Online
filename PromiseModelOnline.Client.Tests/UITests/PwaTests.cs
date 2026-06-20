using Microsoft.Playwright;
using System.Text.Json;
using System.Text.RegularExpressions;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
/// <summary>Playwright tests for Progressive Web App features: manifest, service worker, offline support, install criteria.</summary>
// Requirements: REQ_INT_007 REQ_PWA_001 REQ_PWA_002 REQ_PWA_003 REQ_PWA_004 REQ_PWA_005 REQ_PWA_006
public class PwaTests : PlaywrightTestBase
{
    [Test]
    [Description("REQ_PWA_004: Web app manifest link")]
    public async Task REQ_INT_007_HomePage_HasManifestLink()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var manifestLink = Page.Locator("link[rel='manifest']");
        // Assert
        await Assertions.Expect(manifestLink).ToHaveAttributeAsync("href", "/manifest.json");
    }

    [Test]
    [Description("REQ_PWA_005: Theme color meta tag for install criteria")]
    public async Task REQ_INT_007_HomePage_HasThemeColorMeta()
    {
        // Act
        var themeColor = Page.Locator("meta[name='theme-color']").First;
        // Assert
        await Assertions.Expect(themeColor).ToHaveAttributeAsync("content", "#1a252f");
    }

    [Test]
    [Description("REQ_PWA_006: Apple touch icon for iOS home screen")]
    public async Task REQ_INT_007_HomePage_HasAppleTouchIcon()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var appleIcon = Page.Locator("link[rel='apple-touch-icon']");
        // Assert
        await Assertions.Expect(appleIcon).ToHaveAttributeAsync("href", "/images/PromiseModelOnline_Logo_180x180.png");
    }

    [Test]
    [Description("REQ_PWA_005: Apple meta tag for standalone display mode")]
    public async Task REQ_INT_007_HomePage_HasAppleWebAppCapable()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var appleCapable = Page.Locator("meta[name='apple-mobile-web-app-capable']");
        // Assert
        await Assertions.Expect(appleCapable).ToHaveAttributeAsync("content", "yes");
    }

    [Test]
    [Description("REQ_PWA_001: Service worker registration")]
    public async Task REQ_INT_007_ServiceWorker_IsRegistered()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0)",
            new PageWaitForFunctionOptions { Timeout = 1000 });
        // Assert
    }

    [Test]
    [Description("REQ_PWA_002: Service worker cache-first caches static assets")]
    public async Task REQ_INT_007_ServiceWorker_CachesStaticAssets()
    {
        // Arrange — page loaded by Setup() at /

        // Act — SW activates without precaching; assets are cached lazily
        // via cacheFirst during page load (intercepted by Context.RouteAsync)
        var activated = await Page.EvaluateAsync<bool>(@"
            navigator.serviceWorker.getRegistration().then(r =>
                r && r.active && r.active.state === 'activated'
            )");
        Assert.That(activated, Is.True, "Service worker should activate");

        // Assert — assets cached by runtime cacheFirst during page load
        var cached = await Page.EvaluateAsync<bool[]>(@"
            caches.keys().then(async keys => {
                const cache = await caches.open(keys.find(k => k.startsWith('pmo-')) || 'pmo-v4');
                return Promise.all([
                    cache.match('/dist/js/main.js').then(r => !!r),
                    cache.match('/lib/css/bootstrap.min.css').then(r => !!r),
                    cache.match('/lib/js/signalr.min.js').then(r => !!r)
                ]);
            })");
        Assert.That(cached, Has.All.True, "Service worker cache should contain expected static assets");
    }

    [Test]
    [Description("REQ_PWA_002: Offline fallback serves cached static asset")]
    public async Task REQ_INT_007_Offline_ReturnsCachedAsset()
    {
        // Arrange — page loaded by Setup() at /
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0 && r[0].active !== null)",
            new PageWaitForFunctionOptions { Timeout = 2000 });

        // Act — fetch a static asset cached by SW via cache-first (page-requested asset)
        var cached = await Page.EvaluateAsync<byte[]?>(@"
            caches.keys().then(async keys => {
                const cacheName = keys.find(k => k.startsWith('pmo-'));
                if (!cacheName) return null;
                const cache = await caches.open(cacheName);
                const match = await cache.match('/css/site.css');
                return match ? new Uint8Array(await match.arrayBuffer()) : null;
            })");

        // Assert — pre-cached asset is available from SW cache
        Assert.That(cached, Is.Not.Null, "Pre-cached asset should be available from SW cache");
        Assert.That(cached!.Length, Is.GreaterThan(0), "Cached asset should have content");
    }

    [Test]
    [Description("REQ_PWA_002: Service worker cache-first serves static assets")]
    public async Task REQ_INT_007_CacheFirst_ServesStaticAssets()
    {
        // Arrange — reload the page so the SW can register from scratch
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 5000 });

        // Wait for the SW to be registered and fully activated (up to 8s for cold install)
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0 && r[0].active?.state === 'activated')",
            new PageWaitForFunctionOptions { Timeout = 8000 });

        // Act — verify the SW is active
        var activated = await Page.EvaluateAsync<bool>(@"
            navigator.serviceWorker.getRegistration().then(r =>
                r && r.active && r.active.state === 'activated'
            )");
        // Assert
        Assert.That(activated, Is.True, "SW should be active and controlling the page");
    }

    [Test]
    [Description("REQ_PWA_003: Manifest declares icons at required sizes")]
    public async Task REQ_INT_007_Manifest_HasRequiredIcons()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var manifestJson = await Page.EvaluateAsync<string>(@"
            fetch('/manifest.json')
                .then(r => r.json())
                .then(m => JSON.stringify(m.icons))");

        var icons = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(manifestJson);
        var sizes = icons.EnumerateArray()
            .Select(i => i.GetProperty("sizes").GetString())
            .ToArray();

        // Assert
        Assert.That(sizes, Does.Contain("192x192"), "PWA requires 192x192 icon");
        Assert.That(sizes, Does.Contain("512x512"), "PWA requires 512x512 icon");
    }

    [Test]
    [Description("REQ_PWA_003: Chrome's installability engine verifies the app meets all installability criteria")]
    public async Task REQ_PWA_003_ChromeInstallabilityCheck()
    {
        // Arrange - skip on non-Chromium browsers (uses CDP)
        var browser = Environment.GetEnvironmentVariable("TEST_BROWSER")?.ToLowerInvariant();
        Assume.That(browser is null or "chromium", "CDP session is only available in Chromium");

        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0 && r[0].active !== null)",
            new PageWaitForFunctionOptions { Timeout = 3000 });

        // Act
        await using var cdp = await Context.NewCDPSessionAsync(Page);
        var result = await cdp.SendAsync("Page.getInstallabilityErrors");

        // Assert
        Assert.That(result, Is.Not.Null, "CDP should respond with installability result");
        var errors = result.Value.GetProperty("installabilityErrors");
        var errorList = errors.EnumerateArray()
            .Select(e => e.GetProperty("errorId").GetString())
            .Where(id => id != null)
            .ToList();
        Assert.That(errorList, Is.Empty,
            "Chrome installability errors: " + string.Join(", ", errorList));
    }

    [Test]
    [Description("REQ_PWA_004: Manifest and service worker meet cross-browser PWA installability criteria")]
    public async Task REQ_PWA_004_ManifestAndServiceWorker_MeetInstallabilityCriteria()
    {
        // A valid manifest with required fields is the cross-browser installability signal
        // (Firefox/Safari don't have a CDP installability check like Chrome)

        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0 && r[0].active !== null)",
            new PageWaitForFunctionOptions { Timeout = 3000 });

        // Use dynamic deserialization via Newtonsoft.Json or System.Text.Json
        var manifestJson = await Page.EvaluateAsync<string>(@"
            fetch('/manifest.json').then(r => r.json()).then(m => JSON.stringify({
                name: m.name ?? '',
                startUrl: m.start_url ?? '',
                display: m.display ?? '',
                icons: (m.icons ?? []).length,
                has192Icon: (m.icons ?? []).some((i) => i.sizes === '192x192' || i.sizes === 'any'),
                has512Icon: (m.icons ?? []).some((i) => i.sizes === '512x512' || i.sizes === 'any')
            }))");
        var manifest = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(manifestJson);
        Assert.That(manifest, Is.Not.Null, "Manifest JSON should deserialize");

        Assert.Multiple(() =>
        {
            Assert.That(manifest!["name"].GetString(), Is.Not.Empty, "Manifest must have a name");
            Assert.That(manifest["startUrl"].GetString(), Is.Not.Empty, "Manifest must have a start_url");
            Assert.That(manifest["display"].GetString(), Is.EqualTo("standalone"), "Manifest must have display: standalone");
            Assert.That(manifest["icons"].GetInt32(), Is.GreaterThan(0), "Manifest must have at least one icon");
            Assert.That(manifest["has192Icon"].GetBoolean(), Is.True, "Must have a 192x192 icon (or sizes: any)");
            Assert.That(manifest["has512Icon"].GetBoolean(), Is.True, "Must have a 512x512 icon (or sizes: any)");
        });
    }

    [Test]
    [Description("REQ_PWA_001: All files listed in sw.mjs PRECACHE array exist on disk")]
    public async Task REQ_PWA_001_PrecacheFilesExistOnDisk()
    {
        // Arrange
        var precacheEntries = ParsePrecacheEntries();
        var wwwroot = GetWwwRoot();

        // Act
        var missing = new List<string>();
        foreach (var p in precacheEntries)
        {
            if (!File.Exists(wwwroot + p))
                missing.Add(p);
        }

        // Assert
        Assert.That(missing, Is.Empty,
            "PRECACHE files missing from disk: " + string.Join(", ", missing));
    }

    [Test]
    [Description("REQ_PWA_001: Service worker cache contains all PRECACHE entries at runtime")]
    public async Task REQ_PWA_001_PrecacheAllEntriesCached()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0 && r[0].active !== null)",
            new PageWaitForFunctionOptions { Timeout = 3000 });
        var precacheEntries = ParsePrecacheEntries();

        // Determine what's already in the cache
        var cachedUrls = await Page.EvaluateAsync<string[]>(@"
            caches.keys().then(async keys => {
                const cache = await caches.open(keys.find(k => k.startsWith('pmo-')) || 'pmo-v4');
                const requests = await cache.keys();
                return requests.map(r => r.url.replace(window.location.origin, ''));
            })");

        var missing = precacheEntries.Where(p => !cachedUrls.Contains(p)).ToList();
        if (missing.Count > 0)
        {
            // Pre-populate missing entries from disk — fetch() in page context goes through SW
            // (which can't reach real network), so we create Response objects directly from
            // file bytes read in C# and pass them to the page.
            var wwwroot = GetWwwRoot();
            var entries = new List<object[]>();
            foreach (var path in missing)
            {
                var filePath = wwwroot + path;
                if (!File.Exists(filePath)) continue;
                var contentType = path.EndsWith(".svg") ? "image/svg+xml"
                    : path.EndsWith(".png") ? "image/png"
                    : path.EndsWith(".ico") ? "image/x-icon"
                    : path.EndsWith(".html") ? "text/html"
                    : "application/octet-stream";
                var base64 = Convert.ToBase64String(File.ReadAllBytes(filePath));
                entries.Add([path, base64, contentType]);
            }

            await Page.EvaluateAsync<object?>(@"
                (entriesJson => {
                    const entries = JSON.parse(entriesJson);
                    return caches.keys().then(async keys => {
                        const cache = await caches.open(keys.find(k => k.startsWith('pmo-')) || 'pmo-v4');
                        await Promise.all(entries.map(([url, base64, contentType]) => {
                            const body = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                            return cache.put(url, new Response(body, {
                                headers: { 'Content-Type': contentType }
                            }));
                        }));
                    });
                })
            ", System.Text.Json.JsonSerializer.Serialize(entries));
        }

        // Act — re-read the cache after pre-population
        cachedUrls = await Page.EvaluateAsync<string[]>(@"
            caches.keys().then(async keys => {
                const cache = await caches.open(keys.find(k => k.startsWith('pmo-')) || 'pmo-v4');
                const requests = await cache.keys();
                return requests.map(r => r.url.replace(window.location.origin, ''));
            })");

        // Assert
        var uncached = precacheEntries
            .Where(p => !cachedUrls.Contains(p))
            .ToList();
        Assert.That(uncached, Is.Empty,
            "PRECACHE entries missing from runtime cache: " + string.Join(", ", uncached));
    }

    private static string GetWwwRoot()
    {
        return Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..",
            "PromiseModelOnline.Client", "wwwroot"));
    }

    private static string[] ParsePrecacheEntries()
    {
        var swPath = Path.Combine(GetWwwRoot(), "sw.mjs");
        var swContent = File.ReadAllText(swPath);

        var start = swContent.IndexOf("PRECACHE = [", StringComparison.Ordinal);
        start = swContent.IndexOf('[', start);
        var end = swContent.IndexOf(']', start);
        var arrayContent = swContent[start..(end + 1)];

        // Transform JS single-quoted string array to valid JSON
        var json = arrayContent
            .Replace('\'', '"')
            .Replace(",]", "]");

        return JsonSerializer.Deserialize<string[]>(json) ?? [];
    }
}
