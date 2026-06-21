namespace PromiseModelOnline.Client.Tests.Helpers;

/// <summary>Viewport sizes used for responsive design testing.</summary>
public enum Viewport
{
    /// <summary>1366x900 — standard desktop resolution.</summary>
    Desktop,
    /// <summary>1024x768 — common tablet resolution.</summary>
    Tablet,
    /// <summary>412x915 — typical mobile phone resolution.</summary>
    Mobile
}

/// <summary>Provides pixel dimensions for each <see cref="Viewport"/> value.</summary>
public static class ViewportDimensions
{
    /// <summary>Get the width and height for a given viewport.</summary>
    public static (int width, int height) Get(Viewport vp) => vp switch
    {
        Viewport.Desktop => (1366, 900),
        Viewport.Tablet => (1024, 768),
        Viewport.Mobile => (412, 915),
        _ => (1366, 900)
    };
}

/// <summary>Base class for responsive UI tests, extending <see cref="PlaywrightTestBase"/> with viewport management, responsive assertions, and WCAG touch target validation.</summary>
// Requirements: REQ_WCAG_004 REQ_WCAG_005
public abstract class ResponsivePlaywrightTestBase : PlaywrightTestBase
{
    /// <summary>Set the browser viewport to a predefined size.</summary>
    protected async Task SetViewportAsync(Viewport vp)
    {
        var (w, h) = ViewportDimensions.Get(vp);
        await Page.SetViewportSizeAsync(w, h);
    }

    /// <summary>Navigate to a path with a simulated session at a specific viewport.</summary>
    protected async Task NavigateAsUserAsync(Viewport vp, string path, string sessionValue = "owner-session")
    {
        await SetViewportAsync(vp);
        await NavigateAsUser(path, sessionValue);
    }

    /// <summary>Ensure logged in and navigate to a path at a specific viewport.</summary>
    protected async Task EnsureLoggedInAsync(Viewport vp, string targetPath = "/")
    {
        await SetViewportAsync(vp);
        await EnsureLoggedIn(targetPath);
    }

    /// <summary>Assert the page has no horizontal scrollbar at the current viewport.</summary>
    protected async Task AssertNoHorizontalScrollAsync()
    {
        var hasScroll = await Page.EvaluateAsync<bool>(
            "document.documentElement.scrollWidth > document.documentElement.clientWidth");
        Assert.That(hasScroll, Is.False, "Page should not have horizontal scroll at this viewport");
    }

    /// <summary>Assert a CSS selector matches a visible element.</summary>
    protected async Task AssertElementVisibleAsync(string selector, string message = "")
    {
        var visible = await Page.Locator(selector).First.IsVisibleAsync();
        Assert.That(visible, message);
    }

    /// <summary>Assert a CSS selector does not match a visible element.</summary>
    protected async Task AssertElementNotVisibleAsync(string selector)
    {
        var visible = await Page.Locator(selector).First.IsVisibleAsync();
        Assert.That(visible, Is.False, $"Element '{selector}' should not be visible");
    }

    /// <summary>Assert the correct element is shown for desktop vs mobile viewports.</summary>
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

    /// <summary>Assert an element meets the minimum touch target size (default 44px per WCAG).</summary>
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
