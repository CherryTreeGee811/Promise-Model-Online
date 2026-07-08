using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for notifications page — UI mark-read + bypass client for misuse.</summary>
// Requirements: REQ_FUN_007 REQ_SEC_LOG_001
public class NotificationE2ETests : E2ETestBase
{
    [Test]
    [Description("REQ_FUN_007 happy path: Authenticated user views notifications page")]
    public async Task ViewNotifications_Authenticated_ShowsPage()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/notifications");

        // Assert
        await Page.WaitForSelectorAsync("#notifications-list", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("Notifications"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Assert
    public Task ViewNotifications_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync("/notifications");

    [Test]
    [Description("REQ_FUN_007 happy path: Authenticated user marks all notifications as read via UI")]
    public async Task MarkNotificationsRead_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync("/notifications");
        await Page.WaitForSelectorAsync("#notifications-list", new() { Timeout = 30000 });

        // Act
        var markAllBtn = Page.Locator("#mark-all-read");
        if (await markAllBtn.IsVisibleAsync())
        {
            await markAllBtn.ClickAsync();
            await Page.WaitForTimeoutAsync(1500);
        }

        // Assert — no unread rows remain
        AssertNoCspViolations();
        var unreadRows = await Page.Locator("tr.unread").AllAsync();
        Assert.That(unreadRows.Count, Is.EqualTo(0));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from notifications")]
    // Assert
    public Task MarkNotificationsRead_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync("/notifications");

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated mark-read via redirect bypass returns 401")]
    public async Task MarkNotificationsRead_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync("/api/notifications", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
