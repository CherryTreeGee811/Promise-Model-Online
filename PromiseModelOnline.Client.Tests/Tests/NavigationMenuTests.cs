using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the SPA navigation menu.</summary>
// Requirements: REQ_INT_009
public class NavigationMenuTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_INT_009_Anonymous_ShowsLoginAndRegisterLinks()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/");

        // Act
        await WaitForSelectorAsync("#login-link", 5);
        await WaitForSelectorAsync("#register-link", 5);

        // Assert
        Assert.That(await IsVisibleAsync("#login-link"), Is.True);
        Assert.That(await IsVisibleAsync("#register-link"), Is.True);
    }

    [Test]
    public async Task REQ_INT_009_Anonymous_DoesNotShowAuthenticatedLinks()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/");
        await WaitForSelectorAsync("#login-link", 5);

        // Act & Assert
        Assert.That(await CountElementsAsync("#projects-link"), Is.EqualTo(0));
        Assert.That(await CountElementsAsync("#logout-link"), Is.EqualTo(0));
        Assert.That(await CountElementsAsync("#notifications-link"), Is.EqualTo(0));
    }

    [Test]
    public async Task REQ_INT_009_Authenticated_ShowsProjectLinksAndUserDropdown()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        await WaitForSelectorAsync("#projects-link", 5);

        // Assert
        Assert.That(await IsVisibleAsync("#projects-link"), Is.True);
        Assert.That(await IsVisibleAsync("#my-tasks-link"), Is.True);
        Assert.That(await IsVisibleAsync("#notifications-link"), Is.True);

        Assert.That(await IsVisibleAsync("#user-dropdown"), Is.True);

        Assert.That(await IsVisibleAsync("#logout-link"), Is.False);
        Assert.That(await IsVisibleAsync("#change-password-link"), Is.False);

        // Act
        await Page.Locator("#user-dropdown").ClickAsync();

        // Assert
        Assert.That(await IsVisibleAsync("#logout-link"), Is.True);
        Assert.That(await IsVisibleAsync("#change-password-link"), Is.True);
        Assert.That(await IsVisibleAsync("#invitations-link"), Is.True);
        Assert.That(await IsVisibleAsync("#knowledge-base-link"), Is.True);
    }

    [Test]
    public async Task REQ_INT_009_Authenticated_DoesNotShowLoginAndRegisterLinks()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        await WaitForSelectorAsync("#projects-link", 5);

        // Act & Assert
        Assert.That(await CountElementsAsync("#login-link"), Is.EqualTo(0));
        Assert.That(await CountElementsAsync("#register-link"), Is.EqualTo(0));
    }

    [Test]
    public async Task REQ_INT_009_Authenticated_NotificationsLink_ShowsBadge()
    {
        // Arrange
        await NavigateAsUser("/");

        var notificationsLink = await WaitForSelectorAsync("#notifications-link", 5);

        // Act
        var badgeVisible = await WaitUntilAsync(async () =>
        {
            var badge = Page.Locator("#notification-badge");
            var visible = await badge.IsVisibleAsync();
            var text = await badge.TextContentAsync();
            return visible && text?.Trim() == "2";
        }, 10);

        // Assert
        Assert.That(badgeVisible, Is.True);
    }

    [Test]
    public async Task REQ_INT_009_ClickProjectLink_NavigatesToProjects()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        await ClickAsync("#projects-link", 5);

        var contains = await WaitForUrlContainsAsync("/projects", 10);

        // Assert
        Assert.That(contains, Is.True);
    }
}
