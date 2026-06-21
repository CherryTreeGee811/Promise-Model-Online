using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the iteration history page with burndown.</summary>
// Requirements: REQ_FUN_030
public class IterationHistoryTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_030_IterationHistory_ShowsIterationAndStrides()
    {
        // Arrange
        await EnsureLoggedIn();
        await NavigateSpaAsync("/pmo_test/seeded-project/iterations");
        // Act
        var iterationRow = await WaitForSelectorAsync("#iterations-list tbody tr");
        // Assert
        Assert.That(await iterationRow.TextContentAsync(), Does.Contain("Sprint 1"));
        // Act
        var viewBtn = await WaitForSelectorAsync(".view-iteration-btn");
        await viewBtn.ClickAsync();
        // Assert
        var strideRow = await WaitForSelectorAsync("#stride-details tbody tr");
        Assert.That(await strideRow.TextContentAsync(), Does.Contain("Stride One"));
    }
}
