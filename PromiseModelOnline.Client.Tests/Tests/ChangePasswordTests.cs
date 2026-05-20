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
            // Navigate to change password page (requires auth)
            Driver.Navigate().GoToUrl(BaseUrl + "/change-password");

            var currentInput = WaitForElement(By.Id("current-password-input"), 5);
            var newInput = WaitForElement(By.Id("new-password-input"), 5);
            var confirmInput = WaitForElement(By.Id("confirm-password-input"), 5);

            currentInput.SendKeys("oldpass");
            newInput.SendKeys("newpass123");
            confirmInput.SendKeys("newpass123");
            ScrollToAndClick(By.Id("change-password-btn"));

            // The success message should appear, then after logout and redirect, we should land on /login
            // The test code shows a success message and then auto-logout and redirect to /login after 1.2s.
            // Let's wait for the URL to change to /login
            WaitUntil(driver => driver.Url.Contains("/login"), 10);

            Assert.That(Driver.Url, Does.Contain("/login"));
        }
    }
}