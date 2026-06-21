using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the stride board page.</summary>
// Requirements: REQ_FUN_009
public class StrideBoardTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_009_StrideBoard_LoadsSuccessfully()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var strideCard = await WaitForSelectorAsync(".stride-card");
        // Assert
        Assert.That(strideCard, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_009_StrideBoard_ShowsStrideHeader()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var header = await WaitForSelectorAsync(".stride-header");
        var headerText = await header.TextContentAsync();
        // Assert
        Assert.That(headerText, Is.Not.Empty);
    }

    [Test]
    public async Task REQ_FUN_009_StrideBoard_ShowsBacklogSection()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var backlog = await WaitForSelectorAsync("#backlog-section");
        // Assert
        Assert.That(backlog, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_009_StrideBoard_MomentRowHasStatusDropdown()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var statusSelect = await WaitForSelectorAsync(".status-dropdown");
        // Assert
        Assert.That(statusSelect, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_009_StrideBoard_MomentRowHasEstimateDropdown()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var estimateSelect = await WaitForSelectorAsync(".estimate-dropdown");
        // Assert
        Assert.That(estimateSelect, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_009_StrideBoard_MomentRowHasOwnerDropdown()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        // Act
        var ownerSelect = await WaitForSelectorAsync(".owner-dropdown");
        // Assert
        Assert.That(ownerSelect, Is.Not.Null);
    }
}
