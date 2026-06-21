using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for notification display.</summary>
// Requirements: REQ_FUN_035
public class NotificationsTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_035_Notifications_ShowsBadge_WhenUnreadExist()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        var found = await WaitUntilAsync(async () =>
        {
            var badge = Page.Locator("#notification-badge");
            var visible = await badge.IsVisibleAsync();
            var text = await badge.TextContentAsync();
            return visible && text?.Trim() == "2";
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_035_Notifications_HidesBadge_WhenNoUnread()
    {
        // Arrange
        await NavigateAsUser("/", "nonowner-session");

        // Act
        var found = await WaitUntilAsync(async () =>
        {
            var badge = Page.Locator("#notification-badge");
            var visible = await badge.IsVisibleAsync();
            return !visible;
        }, 2);

        // Assert
        Assert.That(found, Is.True);
    }
}
