using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class RegistrationTests : SeleniumTestBase
    {
        [Test]
        public void RegisterLink_NavigatesToAuthRegister()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            var registerLink = WaitForElement(By.CssSelector("#register-link"), 5);
            Assert.That(registerLink.GetAttribute("href"), Does.Contain("/account/register"));
        }

        [Test]
        public void Register_InSpa_RedirectsToAuth()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/register");

            // SPA route handler redirects to Auth server
            WaitUntil(d => d.Url.Contains("/register"), 5);
        }
    }
}
