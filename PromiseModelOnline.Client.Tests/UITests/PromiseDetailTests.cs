using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the promise detail page.</summary>
// Requirements: REQ_FUN_004
public class PromiseDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_004_PromiseDetail_DisplaysPromiseAndEpics()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/promises/1");
        // Act
        var header = await WaitForSelectorAsync(".promise-detail-card h2");
        var headerText = await header.TextContentAsync();
        var epicRow = await WaitForSelectorAsync("#promise-epics-list tr[data-epic-seq]");
        var epicText = await epicRow.TextContentAsync();
        // Assert
        Assert.That(headerText, Does.Contain("Project Promise One"));
        Assert.That(epicText, Does.Contain("Epic One"));
    }
}
