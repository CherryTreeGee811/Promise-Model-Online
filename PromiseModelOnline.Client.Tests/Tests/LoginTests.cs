using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LoginTests : SeleniumTestBase
    {
        protected override bool ShouldSetDefaultAuthCookie => false;

        [SetUp]
        public void LoginTestSetup()
        {
            // Do NOT set the default auth cookie for login tests
        }

        [Test]
        public void Login_Successful_RedirectsToHome()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            Wait.Until(d => !d.Url.Contains("/login"));

            Assert.That(Driver.Url, Does.StartWith(BaseUrl));
        }

        [Test]
        public void Login_InvalidCredentials_ShowsError()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            var userEl = WaitForElement(By.Id("username-input"), 5);
            var passEl = WaitForElement(By.Id("password-input"), 5);
            var btn = WaitForElement(By.Id("login-btn"), 5);

            userEl.SendKeys("testuser");
            passEl.SendKeys("wrong");
            btn.Click();

            // ✅ wait for error instead of sleep
            var error = WaitForElement(By.Id("error-text"), 5);

            Assert.That(Driver.Url, Does.Contain("/login"));
            Assert.That(error.Text, Does.Contain("Invalid"));
        }

        [Test]
        public void Login_SetsSession_AllowsFutureRequests()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            // Simulate user clicking a link to a protected page (SPA navigation)
            NavigateSpa("/projects");

            // Wait until the protected page actually renders its content
            WaitForElement(By.CssSelector("#project-list-table-body tr"));

            // Verify we are not on the login page
            Assert.That(Driver.Url, Does.Not.Contain("/login"));
        }
    }
}