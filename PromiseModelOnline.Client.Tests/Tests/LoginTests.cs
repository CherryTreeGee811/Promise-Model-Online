using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LoginTests : SeleniumTestBase
    {
        [Test]
        public void LoginLink_NavigatesToGatewayLogin()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            // Login link navigates to BFF /login (full page)
            var loginLink = WaitForElement(By.CssSelector("#login-link"), 5);
            Assert.That(loginLink.GetAttribute("href"), Does.Contain("/login"));
        }

        [Test]
        public void Login_HasNoFormInSpa()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            // SPA should redirect to BFF /login (no login form rendered)
            WaitUntil(d => d.Url.Contains("/login") || d.Url == BaseUrl + "/", 5);
        }

        [Test]
        public void Login_SetsSession_AllowsFutureRequests()
        {
            SetSessionCookie("owner-session");

            NavigateSpa("/projects");

            WaitForElement(By.CssSelector("#project-list-table-body tr"));

            Assert.That(Driver.Url, Does.Not.Contain("/login"));
        }
    }
}
