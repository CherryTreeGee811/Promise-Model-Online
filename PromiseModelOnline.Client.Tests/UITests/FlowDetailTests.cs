using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the flow detail page.</summary>
// Requirements: REQ_FUN_007
public class FlowDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_007_FlowDetail_DisplaysFlowAndMoments()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/flows/1");
        // Act
        var header = await WaitForSelectorAsync(".flow-detail-card h2");
        var headerText = await header.TextContentAsync();
        var allMomentTexts = await Page.Locator("#flow-moments-list tr[data-moment-id]").AllTextContentsAsync();
        // Assert
        Assert.That(headerText, Does.Contain("Flow One"));
        Assert.That(allMomentTexts, Has.One.Contain("Moment 100"));
        Assert.That(allMomentTexts, Has.One.Contain("Moment 101"));
    }
}
