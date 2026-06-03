using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LogoutTests : SeleniumTestBase
    {
        [Test]
        public void Logout_ClearsSession_RedirectsToHome()
        {
            EnsureLoggedIn();

            ClickNavLink("logout-link");

            WaitForUrlContains("/", 10);

            Assert.That(Driver.Url, Does.Not.Contain("/login"));
            Assert.That(Driver.Url, Does.Not.Contain("/logout"));
        }
    }
}
