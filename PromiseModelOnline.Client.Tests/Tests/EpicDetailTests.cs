using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class EpicDetailTests : PlaywrightTestBase
{
    [Test]
    public async Task EpicDetail_DisplaysEpicAndJourneys()
    {
        await NavigateAsUser("/pmo_test/seeded-project/epics/1");

        var header = await WaitForSelectorAsync(".epic-detail-card h2");
        var headerText = await header.TextContentAsync();
        Assert.That(headerText, Does.Contain("Epic One"));

        var journeyLink = await WaitForSelectorAsync("#epic-journeys-list a[journey-id]");
        var linkText = await journeyLink.TextContentAsync();
        Assert.That(linkText, Is.EqualTo("View"));
    }
}
