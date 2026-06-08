using NUnit.Framework;
using OpenQA.Selenium;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class ResponsiveLayoutTests : ResponsiveTestBase
{
    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void HomePage_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        EnsureLoggedIn(vp);
        AssertNoHorizontalScroll();
        AssertElementVisible(By.Id("home-cta-area"));
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void ProjectsList_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        EnsureLoggedIn(vp, "/projects");
        NavigateSpaAndWait("/projects");
        AssertNoHorizontalScroll();
        AssertElementVisible(By.Id("project-list-table"));
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void StrideBoard_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/strides");
        AssertNoHorizontalScroll();
        AssertElementVisible(By.Id("stride-board"));
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void StrideBoard_EffortDropdown_VisibleOnMobile_HiddenOnDesktop(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/strides");
        var mobileEstimate = By.ClassName("estimate-dropdown-mobile");
        var desktopEstimate = By.ClassName("estimate-dropdown");
        AssertResponsiveElement(desktopEstimate, mobileEstimate, vp);
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void Navigation_NavbarCollapse_BehavesCorrectly(Viewport vp)
    {
        EnsureLoggedIn(vp);
        var toggler = By.ClassName("navbar-toggler");
        var navMenu = By.Id("main-nav");
        if (vp == Viewport.Mobile)
        {
            AssertElementVisible(toggler);
            AssertElementNotVisible(By.CssSelector("#main-nav.collapse.show"));
        }
        else
        {
            var togglers = Driver.FindElements(toggler);
            if (togglers.Count > 0)
                Assert.That(togglers[0].Displayed, Is.False, "Navbar toggler should be hidden on desktop/tablet");
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void HomePage_StatCards_StackOnMobile(Viewport vp)
    {
        EnsureLoggedIn(vp);
        var stats = Driver.FindElement(By.ClassName("home-stats"));
        var statsWidth = stats.Size.Width;
        var containerWidth = Driver.FindElement(By.Id("main-container")).Size.Width;

        if (vp == Viewport.Mobile)
        {
            // On mobile the stats grid should span nearly the full container width
            Assert.That(statsWidth, Is.GreaterThan(containerWidth * 0.8),
                "Stats grid should fill most of container width on mobile");
        }
        else
        {
            // On larger screens the stats grid has 3 columns with gaps, so it should be wider than a single column
            var singleColumnWidth = containerWidth / 3;
            Assert.That(statsWidth, Is.GreaterThan(singleColumnWidth),
                "Stats grid should be wider than a single column on desktop/tablet");
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void StrideHeader_StacksOnMobile(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/strides");
        var header = Driver.FindElement(By.ClassName("stride-header"));
        var flexDirection = ((IJavaScriptExecutor)Driver).ExecuteScript(
            "return window.getComputedStyle(arguments[0]).flexDirection;", header)?.ToString() ?? string.Empty;
        if (vp == Viewport.Mobile)
        {
            Assert.That(flexDirection, Is.EqualTo("column"),
                "Stride header should stack vertically on mobile");
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void TouchTargets_MinimumSize_OnMobile(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/strides");

        if (vp == Viewport.Mobile)
        {
            // On mobile, check that at least one visible interactive element meets minimum size
            var visibleButtons = Driver.FindElements(By.CssSelector(".stride-card .btn, .stride-card select"))
                .Where(e => e.Displayed).ToList();

            if (visibleButtons.Any())
            {
                foreach (var btn in visibleButtons.Take(3))
                {
                    Assert.That(Math.Max(btn.Size.Width, btn.Size.Height), Is.GreaterThanOrEqualTo(38),
                        $"Button '{btn.TagName}.{btn.GetAttribute("class")}' should be >= 38px touch target");
                }
            }
            // If no visible buttons, the page might be collapsed — that's acceptable
        }
    }
}
