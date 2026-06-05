using NUnit.Framework;
using OpenQA.Selenium;
using System.Threading;

namespace PromiseModelOnline.Client.Tests.Helpers;

public enum Viewport
{
    Desktop,   // 1366x900
    Tablet,    // 768x1024
    Mobile     // 412x915
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

public abstract class ResponsiveTestBase : SeleniumTestBase
{
    protected void SetViewport(Viewport vp)
    {
        var (w, h) = ViewportDimensions.Get(vp);
        Driver.Manage().Window.Size = new System.Drawing.Size(w, h);
        Thread.Sleep(300);
    }

    protected void NavigateAsUser(Viewport vp, string path, string sessionValue = "owner-session")
    {
        SetViewport(vp);
        NavigateAsUser(path, sessionValue);
    }

    protected void EnsureLoggedIn(Viewport vp, string targetPath = "/")
    {
        SetViewport(vp);
        EnsureLoggedIn(targetPath);
    }

    protected void AssertNoHorizontalScroll()
    {
        var hasScroll = ((IJavaScriptExecutor)Driver).ExecuteScript(
            "return document.documentElement.scrollWidth > document.documentElement.clientWidth;");
        Assert.That(hasScroll, Is.False, "Page should not have horizontal scroll at this viewport");
    }

    protected void AssertElementVisible(By by, string message = "")
    {
        var el = Driver.FindElement(by);
        Assert.That(el.Displayed, message);
    }

    protected void AssertElementNotVisible(By by)
    {
        var elements = Driver.FindElements(by);
        if (elements.Count > 0)
            Assert.That(elements[0].Displayed, Is.False, $"Element {by} should not be visible");
    }

    protected void AssertResponsiveElement(By desktopSelector, By mobileSelector, Viewport vp)
    {
        if (vp == Viewport.Mobile)
        {
            AssertElementNotVisible(desktopSelector);
            AssertElementVisible(mobileSelector);
        }
        else
        {
            AssertElementVisible(desktopSelector);
            AssertElementNotVisible(mobileSelector);
        }
    }

    protected void AssertTouchTargetMinSize(By by, int minPx = 44)
    {
        var el = WaitForElement(by);
        var w = el.Size.Width;
        var h = el.Size.Height;
        Assert.That(Math.Max(w, h), Is.GreaterThanOrEqualTo(minPx),
            $"Element {by} should have at least one dimension >= {minPx}px (got {w}x{h})");
    }
}
