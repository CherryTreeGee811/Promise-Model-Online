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

            currentInput.SendKeys("P@ssw0rd!");
            newInput.SendKeys("NewP@ssw0rd1!");
            confirmInput.SendKeys("NewP@ssw0rd1!");

            ScrollToAndClick(By.Id("change-password-btn"));

            WaitUntil(driver => driver.Url.Contains("/login"), 10);
            Assert.That(Driver.Url, Does.Contain("/login"));
        }

        [Test]
        public void ChangePassword_WrongCurrent_ShowsError()
        {
            EnsureLoggedIn("/change-password");

            WaitForElement(By.Id("current-password-input"), 5).SendKeys("wrong");
            WaitForElement(By.Id("new-password-input"), 5).SendKeys("NewP@ssw0rd1!");
            WaitForElement(By.Id("confirm-password-input"), 5).SendKeys("NewP@ssw0rd1!");

            ScrollToAndClick(By.Id("change-password-btn"));

            var error = WaitForElement(By.Id("error-text"), 5);
            Assert.That(error.Text, Does.Contain("incorrect"));
        }
    }
}