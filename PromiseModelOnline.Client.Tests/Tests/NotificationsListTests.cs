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

            WaitUntil(d => d.FindElements(By.CssSelector("#notifications-list table tbody tr")).Count >= 1, 10);
        }

        [Test]
        public void NotificationsPage_ShowsMarkAllReadButton()
        {
            NavigateAsUser("/notifications");

            WaitUntil(d =>
            {
                var btn = d.FindElement(By.Id("mark-all-read"));
                return btn.Displayed && btn.Text.Contains("Mark All as Read");
            }, 10);
        }

        [Test]
        public void NotificationsPage_UnreadRowHasUnreadClass()
        {
            NavigateAsUser("/notifications");

            WaitUntil(d => d.FindElements(By.CssSelector("#notifications-list tbody tr.unread")).Count == 2, 10);
        }

        [Test]
        public void NotificationsPage_AllRowsAreUnread()
        {
            NavigateAsUser("/notifications");

            WaitUntil(d =>
            {
                var rows = d.FindElements(By.CssSelector("#notifications-list table tbody tr"));
                var unreadRows = d.FindElements(By.CssSelector("#notifications-list tbody tr.unread"));
                return rows.Count > 0 && rows.Count == unreadRows.Count;
            }, 10);
        }
    }
}
