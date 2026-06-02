using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LoginTests : SeleniumTestBase
    {
        [Test]
        public void Login_Successful_RedirectsToHome()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            Assert.That(Driver.Url, Does.StartWith(BaseUrl));
            Assert.That(Driver.Url, Does.Not.Contain("/login"));
        }

        [Test]
        public void Login_InvalidCredentials_ShowsError()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            WaitForElement(By.Id("username-input"), 5).SendKeys("testuser");
            WaitForElement(By.Id("password-input"), 5).SendKeys("wrong");
            ScrollToAndClick(By.Id("login-btn"), 5);

            var error = WaitForElement(By.Id("error-text"), 5);

            Assert.That(Driver.Url, Does.Contain("/login"));
            Assert.That(error.Text, Does.Contain("Invalid"));
        }

        [Test]
        public void Login_SetsSession_AllowsFutureRequests()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            NavigateSpa("/projects");

            WaitForElement(By.CssSelector("#project-list-table-body tr"));

            Assert.That(Driver.Url, Does.Not.Contain("/login"));
        }
    }
}