using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class NavigationMenuTests : SeleniumTestBase
    {
        [Test]
        public void Anonymous_ShowsLoginAndRegisterLinks()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            WaitForElement(By.Id("login-link"), 5);
            WaitForElement(By.Id("register-link"), 5);

            Assert.That(Driver.FindElement(By.Id("login-link")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("register-link")).Displayed, Is.True);
        }

        [Test]
        public void Anonymous_DoesNotShowAuthenticatedLinks()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            WaitForElement(By.Id("login-link"), 5);

            Assert.That(Driver.FindElements(By.Id("projects-link")).Count, Is.EqualTo(0));
            Assert.That(Driver.FindElements(By.Id("logout-link")).Count, Is.EqualTo(0));
            Assert.That(Driver.FindElements(By.Id("notifications-link")).Count, Is.EqualTo(0));
        }

        [Test]
        public void Authenticated_ShowsProjectAndLogoutLinks()
        {
            NavigateAsUser("/");

            WaitForElement(By.Id("projects-link"), 5);
            WaitForElement(By.Id("logout-link"), 5);
            WaitForElement(By.Id("change-password-link"), 5);
            WaitForElement(By.Id("my-tasks-link"), 5);

            Assert.That(Driver.FindElement(By.Id("projects-link")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("logout-link")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("change-password-link")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("my-tasks-link")).Displayed, Is.True);
        }

        [Test]
        public void Authenticated_DoesNotShowLoginAndRegisterLinks()
        {
            NavigateAsUser("/");

            WaitForElement(By.Id("projects-link"), 5);

            Assert.That(Driver.FindElements(By.Id("login-link")).Count, Is.EqualTo(0));
            Assert.That(Driver.FindElements(By.Id("register-link")).Count, Is.EqualTo(0));
        }

        [Test]
        public void Authenticated_NotificationsLink_ShowsBadge()
        {
            NavigateAsUser("/");

            var notificationsLink = WaitForElement(By.Id("notifications-link"), 5);
            var badge = notificationsLink.FindElement(By.Id("notification-badge"));

            WaitUntil(d =>
            {
                try
                {
                    var b = d.FindElement(By.Id("notification-badge"));
                    return b.Displayed && b.Text == "2";
                }
                catch { return false; }
            }, 10);
        }

        [Test]
        public void ClickProjectLink_NavigatesToProjects()
        {
            NavigateAsUser("/");
            ScrollToAndClick(By.Id("projects-link"), 5);

            WaitForUrlContains("/projects", 10);
        }
    }
}
