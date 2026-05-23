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