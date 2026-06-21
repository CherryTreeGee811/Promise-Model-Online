using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the epic detail page.</summary>
// Requirements: REQ_FUN_005
public class EpicDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_005_EpicDetail_DisplaysEpicAndJourneys()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/epics/1");
        // Act
        var header = await WaitForSelectorAsync(".epic-detail-card h2");
        var headerText = await header.TextContentAsync();
        var journeyLink = await WaitForSelectorAsync("#epic-journeys-list a[journey-id]");
        var linkText = await journeyLink.TextContentAsync();
        // Assert
        Assert.That(headerText, Does.Contain("Epic One"));
        Assert.That(linkText, Is.EqualTo("View"));
    }
}
