using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the moment detail page.</summary>
// Requirements: REQ_FUN_008
public class MomentDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_008_MomentDetail_DisplaysMoment()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/moments/100");
        // Act
        var header = await WaitForSelectorAsync(".moment-detail-card h2");
        var headerText = await header.TextContentAsync();
        // Assert
        Assert.That(headerText, Does.Contain("Moment 100"));
    }

    [Test]
    public async Task REQ_FUN_008_MomentDetail_ShowsStatusSelect()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/moments/100");
        // Act
        var statusSelect = await WaitForSelectorAsync("#moment-status-select");
        // Assert
        Assert.That(statusSelect, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_008_MomentDetail_ShowsEstimateSelect()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/moments/100");
        // Act
        var estimateSelect = await WaitForSelectorAsync("#moment-estimate-select");
        // Assert
        Assert.That(estimateSelect, Is.Not.Null);
    }
}
