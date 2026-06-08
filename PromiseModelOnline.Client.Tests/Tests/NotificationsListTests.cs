using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class NotificationsListTests : PlaywrightTestBase
{
    [Test]
    public async Task NotificationsPage_ShowsNotificationList()
    {
        await NavigateAsUser("/notifications");

        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#notifications-list table tbody tr").CountAsync();
            return count >= 1;
        }, 10);

        Assert.That(found, Is.True);
    }

    [Test]
    public async Task NotificationsPage_ShowsMarkAllReadButton()
    {
        await NavigateAsUser("/notifications");

        var found = await WaitUntilAsync(async () =>
        {
            try
            {
                var btn = Page.Locator("#mark-all-read");
                var visible = await btn.IsVisibleAsync();
                var text = await btn.TextContentAsync();
                return visible && text?.Contains("Mark All as Read") == true;
            }
            catch { return false; }
        }, 10);

        Assert.That(found, Is.True);
    }

    [Test]
    public async Task NotificationsPage_UnreadRowHasUnreadClass()
    {
        await NavigateAsUser("/notifications");

        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#notifications-list tbody tr.unread").CountAsync();
            return count == 2;
        }, 10);

        Assert.That(found, Is.True);
    }

    [Test]
    public async Task NotificationsPage_AllRowsAreUnread()
    {
        await NavigateAsUser("/notifications");

        var found = await WaitUntilAsync(async () =>
        {
            var rows = await Page.Locator("#notifications-list table tbody tr").CountAsync();
            var unreadRows = await Page.Locator("#notifications-list tbody tr.unread").CountAsync();
            return rows > 0 && rows == unreadRows;
        }, 10);

        Assert.That(found, Is.True);
    }
}
