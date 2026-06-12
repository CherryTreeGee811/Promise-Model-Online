<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ChangePasswordTests : PlaywrightTestBase
{
    [Test]
    public async Task ChangePasswordLink_HrefPointsToAuth()
    {
        await NavigateAsUser("/");

        await Page.Locator("#user-dropdown").ClickAsync();

        var changePwLink = await WaitForSelectorAsync("#change-password-link", 5);
        var href = await changePwLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/account/change-password"));
    }

    [Test]
    public async Task ChangePassword_Route_RedirectsToAuth()
    {
        await NavigateAsUser("/");
        await Page.GotoAsync(BaseUrl + "/account/change-password");

        var contains = await WaitForUrlContainsAsync("/change-password", 5);
        Assert.That(contains, Is.True);
    }
}
||||||| 1bedf4f
=======
using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class ChangePasswordTests : SeleniumTestBase
    {
        [Test]
        public void ChangePassword_Success_RedirectsToLogin()
        {
            EnsureLoggedIn("/change-password");

            var currentInput = WaitForElement(By.Id("current-password-input"), 5);
            var newInput = WaitForElement(By.Id("new-password-input"), 5);
            var confirmInput = WaitForElement(By.Id("confirm-password-input"), 5);

            // ✅ MUST match real current password
            currentInput.SendKeys("P@ssw0rd!");

            // ✅ MUST meet backend rules
            newInput.SendKeys("NewP@ssw0rd1!");
            confirmInput.SendKeys("NewP@ssw0rd1!");

            ScrollToAndClick(By.Id("change-password-btn"));

            WaitUntil(driver => driver.Url.Contains("/login"), 10);

            Assert.That(Driver.Url, Does.Contain("/login"));
        }
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
