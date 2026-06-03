using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class NotificationsListTests : SeleniumTestBase
    {
        [Test]
        public void NotificationsPage_ShowsNotificationList()
        {
            NavigateAsUser("/notifications");

            WaitForElement(By.Id("notifications-list"), 10);
            var table = WaitForElement(By.CssSelector("#notifications-list table tbody"), 10);

            var rows = table.FindElements(By.CssSelector("tr"));
            Assert.That(rows.Count, Is.GreaterThanOrEqualTo(1));
        }

        [Test]
        public void NotificationsPage_ShowsMarkAllReadButton()
        {
            NavigateAsUser("/notifications");

            var markAllBtn = WaitForElement(By.Id("mark-all-read"), 10);

            Assert.That(markAllBtn.Displayed, Is.True);
            Assert.That(markAllBtn.Text, Does.Contain("Mark All as Read"));
        }

        [Test]
        public void NotificationsPage_UnreadRowHasUnreadClass()
        {
            NavigateAsUser("/notifications");

            WaitForElement(By.CssSelector("#notifications-list tbody tr.unread"), 10);

            var unreadRows = Driver.FindElements(By.CssSelector("#notifications-list tbody tr.unread"));
            Assert.That(unreadRows.Count, Is.EqualTo(2));
        }

        [Test]
        public void NotificationsPage_AllRowsAreUnread()
        {
            NavigateAsUser("/notifications");

            WaitForElement(By.CssSelector("#notifications-list table tbody tr.unread"), 10);

            var rows = Driver.FindElements(By.CssSelector("#notifications-list table tbody tr"));
            var unreadRows = Driver.FindElements(By.CssSelector("#notifications-list tbody tr.unread"));
            Assert.That(rows.Count, Is.EqualTo(unreadRows.Count), "Expected all rows to be unread");
        }
    }
}
