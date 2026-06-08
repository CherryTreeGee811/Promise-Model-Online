namespace PromiseModelOnline.Client.Tests.Helpers;

public enum Viewport
{
    Desktop,
    Tablet,
    Mobile
}

public static class ViewportDimensions
{
    public static (int width, int height) Get(Viewport vp) => vp switch
    {
        Viewport.Desktop => (1366, 900),
        Viewport.Tablet => (1024, 768),
        Viewport.Mobile => (412, 915),
        _ => (1366, 900)
    };
}

public abstract class ResponsivePlaywrightTestBase : PlaywrightTestBase
{
    protected async Task SetViewportAsync(Viewport vp)
    {
        var (w, h) = ViewportDimensions.Get(vp);
        await Page.SetViewportSizeAsync(w, h);
    }

    protected async Task NavigateAsUserAsync(Viewport vp, string path, string sessionValue = "owner-session")
    {
        await SetViewportAsync(vp);
        await NavigateAsUser(path, sessionValue);
    }

    protected async Task EnsureLoggedInAsync(Viewport vp, string targetPath = "/")
    {
        await SetViewportAsync(vp);
        await EnsureLoggedIn(targetPath);
    }

    protected async Task AssertNoHorizontalScrollAsync()
    {
        var hasScroll = await Page.EvaluateAsync<bool>(
            "document.documentElement.scrollWidth > document.documentElement.clientWidth");
        Assert.That(hasScroll, Is.False, "Page should not have horizontal scroll at this viewport");
    }

    protected async Task AssertElementVisibleAsync(string selector, string message = "")
    {
        var visible = await Page.Locator(selector).First.IsVisibleAsync();
        Assert.That(visible, message);
    }

    protected async Task AssertElementNotVisibleAsync(string selector)
    {
        var visible = await Page.Locator(selector).First.IsVisibleAsync();
        Assert.That(visible, Is.False, $"Element '{selector}' should not be visible");
    }

    protected async Task AssertResponsiveElementAsync(string desktopSelector, string mobileSelector, Viewport vp)
    {
        if (vp == Viewport.Mobile)
        {
            await AssertElementNotVisibleAsync(desktopSelector);
            await AssertElementVisibleAsync(mobileSelector);
        }
        else
        {
            await AssertElementVisibleAsync(desktopSelector);
            await AssertElementNotVisibleAsync(mobileSelector);
        }
    }

    protected async Task AssertTouchTargetMinSizeAsync(string selector, int minPx = 44)
    {
        var locator = Page.Locator(selector);
        var box = await locator.BoundingBoxAsync();
        Assert.That(box, Is.Not.Null, $"Element '{selector}' not found");
        var size = Math.Max(box!.Width, box.Height);
        Assert.That(size, Is.GreaterThanOrEqualTo(minPx),
            $"Element '{selector}' should have at least one dimension >= {minPx}px (got {box.Width}x{box.Height})");
    }
}
