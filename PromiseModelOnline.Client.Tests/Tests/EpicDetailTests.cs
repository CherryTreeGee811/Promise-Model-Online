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

            var journeyLink = WaitForElement(By.CssSelector("#epic-journeys-list a[journey-id]"));
            Assert.That(journeyLink.Text, Is.EqualTo("View"));
        }
    }
}