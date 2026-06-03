using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class NotificationsTests : SeleniumTestBase
    {
        [Test]
        public void Notifications_ShowsBadge_WhenUnreadExist()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            WaitUntil(d =>
            {
                var badge = d.FindElement(By.Id("notification-badge"));
                return badge.Displayed && badge.Text == "1";
            }, 10);
        }

        [Test]
        public void Notifications_HidesBadge_WhenNoUnread()
        {
            LoginViaUi("nonowner", "P@ssw0rd!");

            WaitUntil(d =>
            {
                var badge = d.FindElement(By.Id("notification-badge"));
                return !badge.Displayed;
            }, 10);
        }
    }
}
