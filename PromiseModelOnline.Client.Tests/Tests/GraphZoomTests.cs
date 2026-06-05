using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System.Text.RegularExpressions;

namespace PromiseModelOnline.Client.Tests.Tests;

public class GraphZoomTests : SeleniumTestBase
{
    [Test]
    public void GraphPage_LoadsSuccessfully()
    {
        NavigateAsUser("/projects/1/graph");

        var graphContent = WaitForElement(By.Id("graph-content"), 10);
        Assert.That(graphContent.Displayed, Is.True);

        var svg = graphContent.FindElement(By.CssSelector("svg"));
        Assert.That(svg.Displayed, Is.True);
    }

    [Test]
    public void GraphPage_ShowsZoomControls()
    {
        NavigateAsUser("/projects/1/graph");

        WaitForElement(By.Id("graph-content"), 10);

        var zoomToolbar = WaitForElement(By.Id("graph-zoom-controls"), 10);
        Assert.That(zoomToolbar.Displayed, Is.True);
        Assert.That(zoomToolbar.GetAttribute("role"), Is.EqualTo("toolbar"));
        Assert.That(zoomToolbar.GetAttribute("aria-label"), Is.EqualTo("Graph zoom controls"));

        Assert.That(Driver.FindElement(By.Id("graph-zoom-in")).Displayed, Is.True);
        Assert.That(Driver.FindElement(By.Id("graph-zoom-out")).Displayed, Is.True);
        Assert.That(Driver.FindElement(By.Id("graph-zoom-reset")).Displayed, Is.True);
    }

    [Test]
    public void GraphZoomControls_MeetTouchTargetSize()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        foreach (var id in new[] { "graph-zoom-in", "graph-zoom-out", "graph-zoom-reset" })
        {
            var btn = Driver.FindElement(By.Id(id));
            var w = btn.Size.Width;
            var h = btn.Size.Height;
            Assert.That(Math.Max(w, h), Is.GreaterThanOrEqualTo(44),
                $"Zoom button #{id} should meet 44px touch target (got {w}x{h})");
        }
    }

    [Test]
    public void GraphZoomControls_HaveAccessibleLabels()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        Assert.That(Driver.FindElement(By.Id("graph-zoom-in")).GetAttribute("aria-label"), Is.EqualTo("Zoom in"));
        Assert.That(Driver.FindElement(By.Id("graph-zoom-out")).GetAttribute("aria-label"), Is.EqualTo("Zoom out"));
        Assert.That(Driver.FindElement(By.Id("graph-zoom-reset")).GetAttribute("aria-label"), Is.EqualTo("Reset zoom"));
    }

    [Test]
    public void GraphLoadingIndicator_ShowsThenHides()
    {
        NavigateAsUser("/projects/1/graph");

        var loadingState = WaitForElement(By.Id("graph-loading-state"), 5);
        Assert.That(loadingState.Displayed, Is.True);

        WaitUntil(d =>
        {
            try
            {
                var el = d.FindElement(By.Id("graph-loading-state"));
                return !el.Displayed || el.GetAttribute("aria-hidden") == "true";
            }
            catch { return false; }
        }, 10);
    }

    [Test]
    public void GraphPage_ShowsFilterBar()
    {
        NavigateAsUser("/projects/1/graph");

        var filterBar = WaitForElement(By.Id("graph-filter-bar"), 10);
        Assert.That(filterBar.Displayed, Is.True);
    }

    [Test]
    public void GraphPage_ShowsFilterSummary()
    {
        NavigateAsUser("/projects/1/graph");

        WaitUntil(d =>
        {
            try
            {
                var summary = d.FindElement(By.Id("graph-filter-summary"));
                return summary.Displayed && !string.IsNullOrWhiteSpace(summary.Text);
            }
            catch { return false; }
        }, 10);
    }

    [Test]
    public void GraphZoomIn_TransformsGraph()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var svgGroup = Driver.FindElement(By.CssSelector("#graph-content svg > g"));
        var initialTransform = svgGroup.GetAttribute("transform");

        ScrollToAndClick(By.Id("graph-zoom-in"), 10);
        Thread.Sleep(400);

        var afterZoom = svgGroup.GetAttribute("transform");
        Assert.That(afterZoom, Is.Not.EqualTo(initialTransform),
            "Zoom in should change the graph transform");
    }

    [Test]
    public void GraphZoomReset_ClearsUserTransform()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var svgGroup = Driver.FindElement(By.CssSelector("#graph-content svg > g"));
        var initialTransform = svgGroup.GetAttribute("transform");

        ScrollToAndClick(By.Id("graph-zoom-in"), 10);
        Thread.Sleep(400);

        var afterZoomIn = svgGroup.GetAttribute("transform");
        Assert.That(afterZoomIn, Is.Not.EqualTo(initialTransform),
            "Zoom in should change the graph transform");

        ScrollToAndClick(By.Id("graph-zoom-reset"), 10);
        Thread.Sleep(400);

        var afterReset = svgGroup.GetAttribute("transform");
        Assert.That(afterReset, Is.Not.EqualTo(afterZoomIn),
            "Zoom reset should produce a different transform from zoomed-in state");
    }

    [Test]
    public void GraphZoomOut_TransformsGraph()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var svgGroup = Driver.FindElement(By.CssSelector("#graph-content svg > g"));
        var initialTransform = svgGroup.GetAttribute("transform");

        ScrollToAndClick(By.Id("graph-zoom-out"), 10);
        Thread.Sleep(400);

        var afterZoom = svgGroup.GetAttribute("transform");
        Assert.That(afterZoom, Is.Not.EqualTo(initialTransform),
            "Zoom out should change the graph transform");
    }

    [Test]
    public void GraphNode_HasCardElements()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var cards = Driver.FindElements(By.CssSelector("#graph-content .graph-card"));
        Assert.That(cards.Count, Is.GreaterThanOrEqualTo(1),
            "Graph should render at least one card");
    }

    [Test]
    public void GraphNodeCards_HaveAccentColors()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var accents = Driver.FindElements(By.CssSelector("#graph-content .graph-card-accent"));
        Assert.That(accents.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    public void GraphNode_LinksToDetailPage()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);

        var graphLinks = Driver.FindElements(By.CssSelector("#graph-content a.graph-node"));
        Assert.That(graphLinks.Count, Is.GreaterThanOrEqualTo(1));

        var href = graphLinks[0].GetAttribute("href");
        Assert.That(href, Does.Contain("/projects/1/"));
    }

    [Test]
    public void Graph_NoConsoleErrors()
    {
        NavigateAsUser("/projects/1/graph");
        WaitForElement(By.Id("graph-content"), 10);
        Thread.Sleep(1000);

        var logs = Driver.Manage().Logs.GetLog(LogType.Browser);
        var errors = logs
            .Where(log => log.Level == LogLevel.Severe)
            .Where(log => !log.Message.Contains("/api/users/me", StringComparison.OrdinalIgnoreCase))
            .ToList();
        Assert.That(errors, Is.Empty, "Browser console should have no severe errors");
    }
}
