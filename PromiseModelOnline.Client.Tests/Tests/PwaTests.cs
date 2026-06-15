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
        await Page.GotoAsync(BaseUrl + "/");

        // Act
        var manifestLink = Page.Locator("link[rel='manifest']");
        // Assert
        await Assertions.Expect(manifestLink).ToHaveAttributeAsync("href", "/manifest.json");
    }

    [Test]
    [Description("REQ_PWA_005: Theme color meta tag for install criteria")]
    public async Task REQ_INT_007_HomePage_HasThemeColorMeta()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/");

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
        await Page.GotoAsync(BaseUrl + "/");

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
        await Page.GotoAsync(BaseUrl + "/");

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
        await Page.GotoAsync(BaseUrl + "/");

        // Act
        await Page.WaitForFunctionAsync(
            "navigator.serviceWorker.getRegistrations().then(r => r.length > 0)",
            new PageWaitForFunctionOptions { Timeout = 5000 });
        // Assert
    }
}
