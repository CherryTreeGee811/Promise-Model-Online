using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the notifications list page.</summary>
// Requirements: REQ_FUN_035
public class NotificationsListTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_035_NotificationsPage_ShowsNotificationList()
    {
        // Arrange
        await NavigateAsUser("/notifications");

        // Act
        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#notifications-list table tbody tr").CountAsync();
            return count >= 1;
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_NotificationsPage_ShowsMarkAllReadButton()
    {
        // Arrange
        await NavigateAsUser("/notifications");

        // Act
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
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_NotificationsPage_UnreadRowHasUnreadClass()
    {
        // Arrange
        await NavigateAsUser("/notifications");

        // Act
        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("#notifications-list tbody tr.unread").CountAsync();
            return count == 2;
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_NotificationsPage_AllRowsAreUnread()
    {
        // Arrange
        await NavigateAsUser("/notifications");

        // Act
        var found = await WaitUntilAsync(async () =>
        {
            var rows = await Page.Locator("#notifications-list table tbody tr").CountAsync();
            var unreadRows = await Page.Locator("#notifications-list tbody tr.unread").CountAsync();
            return rows > 0 && rows == unreadRows;
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }
}
