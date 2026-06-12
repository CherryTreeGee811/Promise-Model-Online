using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class PwaTests : PlaywrightTestBase
{
    [Test]
    public async Task HomePage_HasManifestLink()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var manifestLink = Page.Locator("link[rel='manifest']");
        await Assertions.Expect(manifestLink).ToHaveAttributeAsync("href", "/manifest.json");
    }

    [Test]
    public async Task HomePage_HasThemeColorMeta()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var themeColor = Page.Locator("meta[name='theme-color']").First;
        await Assertions.Expect(themeColor).ToHaveAttributeAsync("content", "#1a252f");
    }

    [Test]
    public async Task HomePage_HasAppleTouchIcon()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var appleIcon = Page.Locator("link[rel='apple-touch-icon']");
        await Assertions.Expect(appleIcon).ToHaveAttributeAsync("href", "/images/PromiseModelOnline_Logo_180x180.png");
    }

    [Test]
    public async Task HomePage_HasAppleWebAppCapable()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var appleCapable = Page.Locator("meta[name='apple-mobile-web-app-capable']");
        await Assertions.Expect(appleCapable).ToHaveAttributeAsync("content", "yes");
    }

    [Test]
    public async Task ServiceWorker_IsRegistered()
    {
        await Page.GotoAsync(BaseUrl + "/");
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0)",
            new PageWaitForFunctionOptions { Timeout = 5000 });
    }
}
