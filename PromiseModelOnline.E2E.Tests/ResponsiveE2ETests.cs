namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class ResponsiveE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    private const int MobileWidth = 375;
    private const int MobileHeight = 812;
    private const int TabletWidth = 768;
    private const int TabletHeight = 1024;

    [Test]
    [Description("REQ_FUN_003 responsive: Graph page renders without error at mobile viewport")]
    public async Task GraphPage_MobileViewport_RendersWithoutError()
    {
        // Arrange
        await LoginAsync();
        await Page.SetViewportSizeAsync(MobileWidth, MobileHeight);

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");
        await Page.WaitForSelectorAsync("#graph-viewport", new() { Timeout = 15000 });

        // Assert
        var errorText = await Page.Locator("#error-text").InnerTextAsync();
        Assert.That(errorText, Is.Empty.Or.EqualTo(""), "Graph page should have no error text at mobile size");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_003 responsive: Graph page renders without error at tablet viewport")]
    public async Task GraphPage_TabletViewport_RendersWithoutError()
    {
        // Arrange
        await LoginAsync();
        await Page.SetViewportSizeAsync(TabletWidth, TabletHeight);

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");
        await Page.WaitForSelectorAsync("#graph-viewport", new() { Timeout = 15000 });

        // Assert
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 responsive: Stride board renders without error at mobile viewport")]
    public async Task StrideBoard_MobileViewport_RendersWithoutError()
    {
        // Arrange
        await LoginAsync();
        await Page.SetViewportSizeAsync(MobileWidth, MobileHeight);

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });

        // Assert
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_001 responsive: Login page renders without error at mobile viewport")]
    public async Task LoginPage_MobileViewport_RendersWithoutError()
    {
        // Arrange
        await Page.SetViewportSizeAsync(MobileWidth, MobileHeight);

        // Act
        await Page.GotoAsync("/account/login");

        // Assert
        await Page.WaitForSelectorAsync("#Username", new() { Timeout = 15000 });
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 responsive: Notifications page renders without error at mobile viewport")]
    public async Task NotificationsPage_MobileViewport_RendersWithoutError()
    {
        // Arrange
        await LoginAsync();
        await Page.SetViewportSizeAsync(MobileWidth, MobileHeight);

        // Act
        await Page.GotoAsync("/notifications");
        await Page.WaitForSelectorAsync("#notifications-list", new() { Timeout = 15000 });

        // Assert
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_003 responsive: Detail pages render without error at mobile viewport")]
    public async Task DetailPages_MobileViewport_RenderWithoutError()
    {
        // Arrange
        await LoginAsync();
        await Page.SetViewportSizeAsync(MobileWidth, MobileHeight);

        // Act — navigate through key detail pages
        var pages = new[]
        {
            $"/{Owner}/{Project}/promises/1",
            $"/{Owner}/{Project}/epics/1",
            $"/{Owner}/{Project}/journeys/1",
            $"/{Owner}/{Project}/flows/1",
        };

        foreach (var url in pages)
        {
            await Page.GotoAsync(url);
            await Page.WaitForSelectorAsync(".detail-card", new() { Timeout = 15000 });
            AssertNoCspViolations();
        }
    }
}
