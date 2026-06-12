using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class ResponsiveLayoutTests : ResponsivePlaywrightTestBase
{
    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task HomePage_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);
        await WaitForSelectorAsync("#home-cta-area", 10);
        await AssertNoHorizontalScrollAsync();
        await AssertElementVisibleAsync("#home-cta-area");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task ProjectsList_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        await EnsureLoggedInAsync(vp, "/projects");
        await NavigateSpaAsync("/projects");
        await WaitForSelectorAsync("#project-list-table", 10);
        await AssertNoHorizontalScrollAsync();
        await AssertElementVisibleAsync("#project-list-table");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task StrideBoard_NoHorizontalScroll_AtAnyViewport(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        await WaitForSelectorAsync(".stride-card", 10);
        await AssertNoHorizontalScrollAsync();
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task StrideBoard_EffortDropdown_VisibleOnMobile_HiddenOnDesktop(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        await WaitForSelectorAsync(".stride-header", 10);
        await AssertResponsiveElementAsync(".estimate-dropdown", ".estimate-dropdown-mobile", vp);
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task Navigation_NavbarCollapse_BehavesCorrectly(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);

        if (vp == Viewport.Mobile)
        {
            await AssertElementVisibleAsync(".navbar-toggler");
            await AssertElementNotVisibleAsync("#main-nav.collapse.show");
        }
        else
        {
            var togglerCount = await CountElementsAsync(".navbar-toggler");
            if (togglerCount > 0)
            {
                var visible = await Page.Locator(".navbar-toggler").First.IsVisibleAsync();
                Assert.That(visible, Is.False, "Navbar toggler should be hidden on desktop/tablet");
            }
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task HomePage_StatCards_StackOnMobile(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);
        var stats = Page.Locator(".home-stats");
        var container = Page.Locator("#main-container");

        var statsBox = await stats.BoundingBoxAsync();
        var containerBox = await container.BoundingBoxAsync();

        if (vp == Viewport.Mobile)
        {
            Assert.That(statsBox!.Width, Is.GreaterThan(containerBox!.Width * 0.8),
                "Stats grid should fill most of container width on mobile");
        }
        else
        {
            var singleColumnWidth = containerBox!.Width / 3;
            Assert.That(statsBox!.Width, Is.GreaterThan(singleColumnWidth),
                "Stats grid should be wider than a single column on desktop/tablet");
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task StrideHeader_StacksOnMobile(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        var header = Page.Locator(".stride-header").First;
        var flexDirection = await header.EvaluateAsync<string?>("el => window.getComputedStyle(el).flexDirection");

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
    public async Task TouchTargets_MinimumSize_OnMobile(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");

        if (vp == Viewport.Mobile)
        {
            var buttons = await Page.Locator(".stride-card .btn, .stride-card select").AllAsync();
            var visibleButtons = new List<ILocator>();
            foreach (var btn in buttons)
            {
                if (await btn.IsVisibleAsync())
                    visibleButtons.Add(btn);
            }

            if (visibleButtons.Count > 0)
            {
                foreach (var btn in visibleButtons.Take(3))
                {
                    var box = await btn.BoundingBoxAsync();
                    var size = Math.Max(box!.Width, box.Height);
                    Assert.That(size, Is.GreaterThanOrEqualTo(38),
                        $"Button should be >= 38px touch target (got {box.Width}x{box.Height})");
                }
            }
        }
    }
}
