using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class InvitationsTests : SeleniumTestBase
    {
        [Test]
        public void Invitations_AcceptInvitation_RemovesRow()
        {
            EnsureLoggedIn();

            NavigateSpa("/invitations");

            var acceptBtn = WaitForElement(By.CssSelector(".accept-btn"));
            acceptBtn.Click();

            // After accepting, the row should be removed
            var removed = WaitUntil(driver =>
            {
                try
                {
                    return driver.FindElements(By.CssSelector("tbody tr")).Count == 0;
                }
                catch
                {
                    return false;
                }
            }, 5);

            Assert.That(removed, Is.True, "Invitation row was not removed after accept");
        }
    }
}