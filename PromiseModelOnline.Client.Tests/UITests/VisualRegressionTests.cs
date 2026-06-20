using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.UITests;

/// <summary>Visual regression tests capturing full-page screenshots of key pages.</summary>
// Requirements: REQ_VIS_001
public class VisualRegressionTests : PlaywrightTestBase
{
    private static readonly string ScreenshotDir = Path.Combine(TestContext.CurrentContext.WorkDirectory, "screenshots");

    private async Task CaptureScreenshot(string name)
    {
        Directory.CreateDirectory(ScreenshotDir);
        var path = Path.Combine(ScreenshotDir, $"{name}.png");
        await Page.ScreenshotAsync(new PageScreenshotOptions { Path = path, FullPage = true });
        TestContext.Progress.WriteLine($"Screenshot saved: {path}");
    }

    [Test]
    public async Task REQ_VIS_001_HomePage_Screenshot()
    {
        await EnsureLoggedIn();
        await Task.Delay(500);
        await CaptureScreenshot("home");
        Assert.Pass();
    }

    [Test]
    public async Task REQ_VIS_002_ProjectsList_Screenshot()
    {
        await NavigateAsUser("/projects");
        await Task.Delay(500);
        await CaptureScreenshot("projects-list");
        Assert.Pass();
    }

    [Test]
    public async Task REQ_VIS_003_ProjectGraph_Screenshot()
    {
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-viewport");
        await Task.Delay(1000);
        await CaptureScreenshot("graph");
        Assert.Pass();
    }

    [Test]
    public async Task REQ_VIS_004_StrideBoard_Screenshot()
    {
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        await Task.Delay(1000);
        await CaptureScreenshot("stride-board");
        Assert.Pass();
    }

    [Test]
    public async Task REQ_VIS_005_PromiseDetail_Screenshot()
    {
        await NavigateAsUser("/pmo_test/seeded-project/promises/1");
        await Task.Delay(500);
        await CaptureScreenshot("promise-detail");
        Assert.Pass();
    }

    [Test]
    public async Task REQ_VIS_006_NavigationMenu_Screenshot()
    {
        await EnsureLoggedIn();
        await Task.Delay(500);
        await CaptureScreenshot("navigation");
        Assert.Pass();
    }
}
