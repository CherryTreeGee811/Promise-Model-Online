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
            // Manual login via UI
            LoginViaUi("anyuser", "anypass");

            // After successful login, the UI should have redirected to "/"
            Assert.That(Driver.Url, Is.EqualTo(BaseUrl + "/"));
        }

        [Test]
        public void Login_InvalidCredentials_ShowsError()
        {
            // Navigate to login page
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            var userEl = WaitForElement(By.Id("username-input"), 5);
            var passEl = WaitForElement(By.Id("password-input"), 5);
            var btn = WaitForElement(By.Id("login-btn"), 5);

            userEl.SendKeys("anyuser");
            passEl.SendKeys("wrong");
            btn.Click();

            // After failed login, the URL should still be /login (or an error message)
            // The client code doesn't show an inline error for 401; it just doesn't redirect.
            // Let's check the URL hasn't changed.
            System.Threading.Thread.Sleep(2000); // wait for possible redirect
            Assert.That(Driver.Url, Does.Contain("/login"));
        }
    }
}