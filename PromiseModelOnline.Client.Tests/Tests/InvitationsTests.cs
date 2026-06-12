<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class InvitationsTests : PlaywrightTestBase
{
    [Test]
    public async Task Invitations_AcceptInvitation_RemovesRow()
    {
        await NavigateAsUser("/invitations");

        var acceptBtn = await WaitForSelectorAsync(".accept-btn");
        await acceptBtn.ClickAsync();

        var removed = await WaitUntilAsync(async () =>
        {
            try
            {
                var count = await Page.Locator("tbody tr").CountAsync();
                return count == 0;
            }
            catch { return false; }
        }, 5);

        Assert.That(removed, Is.True, "Invitation row was not removed after accept");
    }
}
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
