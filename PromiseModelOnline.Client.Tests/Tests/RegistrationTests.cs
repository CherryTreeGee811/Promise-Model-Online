using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class RegistrationTests : SeleniumTestBase
    {
        [Test]
        public void Register_Successful_ShowsSuccessAndRedirects()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/register");

            WaitForElement(By.Id("username-input"), 5).SendKeys("newuser");
            WaitForElement(By.Id("email-input"), 5).SendKeys("newuser@example.com");
            WaitForElement(By.Id("password-input"), 5).SendKeys("P@ssw0rd!");

            ScrollToAndClick(By.Id("register-btn"));

            var success = WaitForElement(By.Id("success-text"), 5);
            Assert.That(success.Text, Does.Contain("successfully"));

            WaitUntil(driver => driver.Url.Contains("/login"), 10);
            Assert.That(Driver.Url, Does.Contain("/login"));
        }

        [Test]
        public void Register_DuplicateUser_ShowsError()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/register");

            WaitForElement(By.Id("username-input"), 5).SendKeys("existinguser");
            WaitForElement(By.Id("email-input"), 5).SendKeys("existing@example.com");
            WaitForElement(By.Id("password-input"), 5).SendKeys("P@ssw0rd!");

            ScrollToAndClick(By.Id("register-btn"));

            var error = WaitForElement(By.Id("error-text"), 5);
            Assert.That(error.Text, Does.Contain("already exists"));
        }

        [Test]
        public void Register_EmptyFields_ShowsValidationError()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/register");

            ScrollToAndClick(By.Id("register-btn"));

            var error = WaitForElement(By.Id("error-text"), 5);
            Assert.That(error.Text, Does.Contain("required"));
        }
    }
}
