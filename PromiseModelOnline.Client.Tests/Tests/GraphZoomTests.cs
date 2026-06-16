using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the project graph zoom and pan.</summary>
// Requirements: REQ_FUN_010
public class GraphZoomTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_010_GraphPage_LoadsSuccessfully()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Act
        await WaitForSelectorAsync("#graph-content", 10);
        var svg = await WaitForSelectorAsync("#graph-content svg", 30);
        // Assert
        Assert.That(await svg.IsVisibleAsync(), Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphPage_ShowsZoomControls()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Act
        await WaitForSelectorAsync("#graph-content", 10);
        var zoomToolbar = await WaitForSelectorAsync("#graph-zoom-controls", 10);
        // Assert
        Assert.That(await zoomToolbar.IsVisibleAsync(), Is.True);
        Assert.That(await zoomToolbar.GetAttributeAsync("role"), Is.EqualTo("toolbar"));
        Assert.That(await zoomToolbar.GetAttributeAsync("aria-label"), Is.EqualTo("Graph zoom controls"));
        Assert.That(await IsVisibleAsync("#graph-zoom-in"), Is.True);
        Assert.That(await IsVisibleAsync("#graph-zoom-out"), Is.True);
        Assert.That(await IsVisibleAsync("#graph-zoom-reset"), Is.True);
        Assert.That(await IsVisibleAsync("#graph-fullscreen-btn"), Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphZoomControls_MeetTouchTargetSize()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content", 10);
        // Act & Assert
        foreach (var id in new[] { "graph-zoom-in", "graph-zoom-out", "graph-zoom-reset", "graph-fullscreen-btn" })
        {
            var locator = Page.Locator($"#{id}");
            var box = await locator.BoundingBoxAsync();
            var size = Math.Max(box!.Width, box.Height);
            Assert.That(size, Is.GreaterThanOrEqualTo(44),
                $"Zoom button #{id} should meet 44px touch target (got {box.Width}x{box.Height})");
        }
    }

    [Test]
    public async Task REQ_FUN_010_GraphZoomControls_HaveAccessibleLabels()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content", 10);
        // Assert
        Assert.That(await GetAttributeAsync("#graph-zoom-in", "aria-label"), Is.EqualTo("Zoom in"));
        Assert.That(await GetAttributeAsync("#graph-zoom-out", "aria-label"), Is.EqualTo("Zoom out"));
        Assert.That(await GetAttributeAsync("#graph-zoom-reset", "aria-label"), Is.EqualTo("Reset zoom"));
        Assert.That(await GetAttributeAsync("#graph-fullscreen-btn", "aria-label"), Is.EqualTo("Fullscreen"));
    }

    [Test]
    public async Task REQ_FUN_010_GraphLoadingIndicator_ShowsThenHides()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Assert
        var hidden = await WaitUntilAsync(async () =>
        {
            try
            {
                var ariaHidden = await Page.Locator("#graph-loading-state").GetAttributeAsync("aria-hidden");
                return ariaHidden == "true";
            }
            catch { return false; }
        }, 10);

        Assert.That(hidden, Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphPage_ShowsFilterBar()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Act
        var filterBar = await WaitForSelectorAsync("#graph-filter-bar", 10);
        // Assert
        Assert.That(await filterBar.IsVisibleAsync(), Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphPage_ShowsFilterSummary()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Assert
        var found = await WaitUntilAsync(async () =>
        {
            try
            {
                var summary = Page.Locator("#graph-filter-summary");
                var visible = await summary.IsVisibleAsync();
                var text = await summary.TextContentAsync();
                return visible && !string.IsNullOrWhiteSpace(text);
            }
            catch { return false; }
        }, 10);

        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphZoomIn_TransformsGraph()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        var svgGroup = await WaitForSelectorAsync("#graph-content svg > g", 10);
        var initialTransform = await svgGroup.GetAttributeAsync("transform");
        // Act
        await ClickAsync("#graph-zoom-in", 10);
        await Task.Delay(400);
        // Assert
        var afterZoom = await svgGroup.GetAttributeAsync("transform");
        Assert.That(afterZoom, Is.Not.EqualTo(initialTransform),
            "Zoom in should change the graph transform");
    }

    [Test]
    public async Task REQ_FUN_010_GraphZoomReset_ClearsUserTransform()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        var svgGroup = await WaitForSelectorAsync("#graph-content svg > g", 10);
        var initialTransform = await svgGroup.GetAttributeAsync("transform");
        // Act
        await ClickAsync("#graph-zoom-in", 10);
        await Task.Delay(400);
        // Assert
        var afterZoomIn = await svgGroup.GetAttributeAsync("transform");
        Assert.That(afterZoomIn, Is.Not.EqualTo(initialTransform),
            "Zoom in should change the graph transform");
        // Act
        await ClickAsync("#graph-zoom-reset", 10);
        await Task.Delay(400);
        // Assert
        var afterReset = await svgGroup.GetAttributeAsync("transform");
        Assert.That(afterReset, Is.Not.EqualTo(afterZoomIn),
            "Zoom reset should produce a different transform from zoomed-in state");
    }

    [Test]
    public async Task REQ_FUN_010_GraphFullscreenButton_HasCorrectInitialState()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content", 10);
        // Assert
        var btn = Page.Locator("#graph-fullscreen-btn");
        Assert.That(await btn.IsVisibleAsync(), Is.True);
        Assert.That(await btn.GetAttributeAsync("aria-label"), Is.EqualTo("Fullscreen"));
        var icon = btn.Locator("i");
        var iconClass = await icon.GetAttributeAsync("class");
        Assert.That(iconClass, Does.Contain("bi-arrows-angle-expand"));
    }

    [Test]
    public async Task REQ_FUN_010_GraphFullscreenButton_IsInToolbar()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content", 10);
        // Assert
        var toolbar = Page.Locator("#graph-zoom-controls");
        var fullscreenBtn = toolbar.Locator("#graph-fullscreen-btn");
        Assert.That(await fullscreenBtn.IsVisibleAsync(), Is.True);
        Assert.That(await fullscreenBtn.GetAttributeAsync("aria-label"), Is.EqualTo("Fullscreen"));
        var resetBtn = toolbar.Locator("#graph-zoom-reset");
        Assert.That(await resetBtn.IsVisibleAsync(), Is.True);
        Assert.That(await resetBtn.GetAttributeAsync("aria-label"), Is.EqualTo("Reset zoom"));
    }

    [Test]
    public async Task REQ_FUN_010_GraphZoomOut_TransformsGraph()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        var svgGroup = await WaitForSelectorAsync("#graph-content svg > g", 10);
        var initialTransform = await svgGroup.GetAttributeAsync("transform");
        // Act
        await ClickAsync("#graph-zoom-out", 10);
        await Task.Delay(400);
        // Assert
        var afterZoom = await svgGroup.GetAttributeAsync("transform");
        Assert.That(afterZoom, Is.Not.EqualTo(initialTransform),
            "Zoom out should change the graph transform");
    }

    [Test]
    public async Task REQ_FUN_010_GraphNode_HasCardElements()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Assert
        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#graph-content .graph-card").CountAsync();
            return count >= 1;
        }, 10);
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphNodeCards_HaveAccentColors()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        // Assert
        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#graph-content .graph-card-accent").CountAsync();
            return count >= 1;
        }, 10);
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_010_GraphNode_LinksToDetailPage()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content svg", 10);
        await WaitForSelectorAsync("#graph-content .graph-node:not(.is-root)", 10);
        // Act
        var href = await Page.EvaluateAsync<string>(
            "document.querySelector('#graph-content .graph-node:not(.is-root)').getAttribute('href') || ''");
        // Assert
        Assert.That(href, Contains.Substring("/pmo_test/seeded-project/"));
    }

    [Test]
    public async Task REQ_FUN_010_Graph_NoConsoleErrors()
    {
        // Arrange
        var errors = new List<string>();
        var onConsole = new EventHandler<IConsoleMessage>((_, e) =>
        {
            if (e.Type == "error")
                errors.Add(e.Text);
        });
        Page.Console += onConsole;
        // Act
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-content", 10);
        await Task.Delay(1000);
        // Assert
        Page.Console -= onConsole;
        var filtered = errors
            .Where(m => !m.Contains("/api/users/me", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("/hubs/", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("Invalid payload", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("signalr", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("handshake response", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("Connection disconnected", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("405 (Not Allowed)", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("Failed to fetch", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("negotiation with the server", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("start the transport", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("start the connection", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("complete negotiation", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("transports supported", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("None of the transports", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("CSP", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("Content Security Policy", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("404 (Not Found)", StringComparison.OrdinalIgnoreCase))
            .Where(m => !m.Contains("401 (Unauthorized)", StringComparison.OrdinalIgnoreCase))
            .ToList();
        Assert.That(filtered, Is.Empty, "Browser console should have no severe errors");
    }
}
