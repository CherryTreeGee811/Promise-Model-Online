<<<<<<< HEAD
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
||||||| 1bedf4f
=======
using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class EpicDetailTests : SeleniumTestBase
    {
        [Test]
        public void EpicDetail_DisplaysEpicAndJourneys()
        {
            EnsureLoggedIn();

            NavigateSpa("/epics/1");

            var header = WaitForElement(By.CssSelector(".epic-detail-card h2"));
            Assert.That(header.Text, Does.Contain("Epic One"));

            var journeyLink = WaitForElement(By.CssSelector("#epic-journeys-list .view-btn"));
            Assert.That(journeyLink.Text, Is.EqualTo("View"));
        }
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
