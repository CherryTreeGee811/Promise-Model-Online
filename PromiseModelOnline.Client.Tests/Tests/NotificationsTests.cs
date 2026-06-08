using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class NotificationsTests : PlaywrightTestBase
{
    [Test]
    public async Task Notifications_ShowsBadge_WhenUnreadExist()
    {
        await SetSessionCookie("owner-session");

        var found = await WaitUntilAsync(async () =>
        {
            var badge = Page.Locator("#notification-badge");
            var visible = await badge.IsVisibleAsync();
            var text = await badge.TextContentAsync();
            return visible && text?.Trim() == "2";
        }, 10);

        Assert.That(found, Is.True);
    }

    [Test]
    public async Task Notifications_HidesBadge_WhenNoUnread()
    {
        await SetSessionCookie("nonowner-session");

        var found = await WaitUntilAsync(async () =>
        {
            var badge = Page.Locator("#notification-badge");
            var visible = await badge.IsVisibleAsync();
            return !visible;
        }, 10);

        Assert.That(found, Is.True);
    }
}
