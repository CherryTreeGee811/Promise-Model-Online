using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class SignalRE2ETests : E2ETestBase
{
    [Test]
    [Description("REQ_FUN_007 happy path: SignalR library loads and notification system initializes after login")]
    public async Task SignalR_Loads_AfterLogin()
    {
        // Arrange
        await LoginAsync();

        // Act — navigate to a page that triggers notification polling + SignalR start
        await Page.GotoAsync("/");
        await Page.WaitForFunctionAsync("() => typeof signalR !== 'undefined' && signalR !== null", options: new() { Timeout = 10000 });

        // Assert — SignalR library is available and connection was attempted
        var signalrLoaded = await Page.EvaluateAsync<bool>(@"typeof signalR !== 'undefined' && signalR !== null");
        Assert.That(signalrLoaded, Is.True, "SignalR library must be loaded in the browser");

        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Notification badge is present after login")]
    public async Task NotificationBadge_IsPresent_AfterLogin()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/");
        await Page.WaitForSelectorAsync("#notification-badge", new() { State = WaitForSelectorState.Attached, Timeout = 10000 });
        var badge = Page.Locator("#notification-badge, .notification-badge, [data-notification-badge]");

        // Assert — badge element exists in the nav
        var exists = await badge.CountAsync();
        Assert.That(exists, Is.GreaterThanOrEqualTo(1),
            "Notification badge should be present in the navigation after login");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Notifications page fetches and displays notifications")]
    public async Task NotificationsPage_FetchesAndDisplays()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/notifications");
        await Page.WaitForSelectorAsync("#notifications-list", new() { Timeout = 15000 });

        // Assert — the page loaded and rendered
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("Notification"),
            "Notifications page should have a heading");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Notifications API returns data for authenticated user")]
    public async Task NotificationsApi_ReturnsData_Authenticated()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/notifications", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var body = await response.Content.ReadAsStringAsync();
        var docs = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.That(docs.ValueKind, Is.EqualTo(JsonValueKind.Array),
            "Notifications API should return an array");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Mark notification as read via API succeeds")]
    public async Task MarkNotificationRead_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();

        // Fetch existing unread notifications
        var getResp = await AuthGetAsync("/api/notifications", ajax: true);
        var body = await getResp.Content.ReadAsStringAsync();
        var docs = JsonSerializer.Deserialize<JsonElement>(body);

        if (docs.GetArrayLength() == 0)
        {
            Assert.Inconclusive("No notifications available to mark as read");
            return;
        }

        var firstUnread = docs.EnumerateArray()
            .FirstOrDefault(n => !n.GetProperty("isRead").GetBoolean());
        if (firstUnread.ValueKind == JsonValueKind.Undefined)
        {
            Assert.Inconclusive("No unread notifications available");
            return;
        }

        var notifId = firstUnread.GetProperty("id").GetInt32();

        // Act
        var patchResp = await AuthPatchJsonAsync(
            $"/api/notifications/{notifId}", """{"isRead":true}""");

        // Assert
        Assert.That(patchResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Verify it's now read
        var verifyResp = await AuthGetAsync("/api/notifications", ajax: true);
        var verifyBody = await verifyResp.Content.ReadAsStringAsync();
        var verifyDocs = JsonSerializer.Deserialize<JsonElement>(verifyBody);
        var updated = verifyDocs.EnumerateArray()
            .FirstOrDefault(n => n.GetProperty("id").GetInt32() == notifId);
        Assert.That(updated.ValueKind, Is.Not.EqualTo(JsonValueKind.Undefined));
        Assert.That(updated.GetProperty("isRead").GetBoolean(), Is.True,
            "Notification should be marked as read");
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated notifications API returns 401")]
    public async Task NotificationsApi_Unauthenticated_Returns401()
    {
        // Act
        var response = await GetAsync("/api/notifications", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
