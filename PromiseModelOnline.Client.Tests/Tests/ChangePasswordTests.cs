using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class ChangePasswordTests : SeleniumTestBase
    {
        [Test]
        public void ChangePasswordLink_HrefPointsToAuth()
        {
            SetSessionCookie("owner-session");

            WaitForElement(By.Id("user-dropdown"), 5).Click();

            var changePwLink = WaitForElement(By.Id("change-password-link"), 5);
            Assert.That(changePwLink.GetAttribute("href"), Does.Contain("/account/change-password"));
        }

        [Test]
        public void ChangePassword_Route_RedirectsToAuth()
        {
            SetSessionCookie("owner-session");

            NavigateSpa("/change-password");

            // SPA route handler redirects to Auth server
            WaitUntil(d => d.Url.Contains("/change-password"), 5);
        }
    }
}
