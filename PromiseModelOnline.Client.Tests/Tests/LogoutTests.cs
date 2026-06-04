using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LogoutTests : SeleniumTestBase
    {
        [Test]
        public void LogoutLink_HrefPointsToGatewayLogout()
        {
            SetSessionCookie("owner-session");

            WaitForElement(By.Id("user-dropdown"), 5).Click();

            var logoutLink = WaitForElement(By.Id("logout-link"), 5);
            Assert.That(logoutLink.GetAttribute("href"), Does.Contain("/logout"));
        }
    }
}
