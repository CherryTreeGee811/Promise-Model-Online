using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the journey detail page.</summary>
// Requirements: REQ_FUN_006
public class JourneyDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_006_JourneyDetail_DisplaysJourneyAndFlows()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/journeys/1");
        // Act
        var header = await WaitForSelectorAsync(".journey-detail-card h2");
        var headerText = await header.TextContentAsync();
        var flowLink = await WaitForSelectorAsync("#journey-flows-list a[flow-id]");
        var linkText = await flowLink.TextContentAsync();
        // Assert
        Assert.That(headerText, Does.Contain("Journey One"));
        Assert.That(linkText, Is.EqualTo("View"));
    }
}
