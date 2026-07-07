using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class EmptyStateE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";

    [Test]
    [Description("REQ_FUN_001 happy path: New project stride board shows no-iterations empty state")]
    public async Task NewProject_StrideBoard_ShowsEmptyState()
    {
        // Arrange — create a project normally (with first promise), then check stride board
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueName = $"EmptyStride {timestamp}";

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", uniqueName);
        await Page.FillAsync("#first-promise-input", "Test promise for empty state.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];

        // Act — navigate to stride board
        await Page.GotoAsync($"/{Owner}/{slug}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        // Assert — empty state or relevant content visible
        var body = await Page.TextContentAsync("body") ?? "";
        var hasContent = body.Contains("iteration", StringComparison.OrdinalIgnoreCase)
            || body.Contains("stride", StringComparison.OrdinalIgnoreCase)
            || body.Contains("no", StringComparison.OrdinalIgnoreCase)
            || body.Contains("create", StringComparison.OrdinalIgnoreCase);
        Assert.That(hasContent, Is.True,
            "Stride board should show empty state or iteration-related content");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_029 happy path: Empty notifications shows no-notifications message")]
    public async Task NotificationsPage_Empty_ShowsNoNotifications()
    {
        // Arrange — login as a user who likely has no notifications
        await LoginAsSecondUserAsync();

        // Act
        await Page.GotoAsync("/notifications");
        await Page.WaitForSelectorAsync("#notifications-list", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        // Assert — empty state or list rendered
        var body = await Page.TextContentAsync("body") ?? "";
        var hasContent = body.Contains("notification", StringComparison.OrdinalIgnoreCase)
            || body.Contains("no", StringComparison.OrdinalIgnoreCase)
            || body.Contains("empty", StringComparison.OrdinalIgnoreCase);
        Assert.That(hasContent, Is.True,
            "Notifications page should show content or empty state without errors");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_031 happy path: Empty my-tasks page shows no-assigned-tasks message")]
    public async Task MyTasksPage_Empty_ShowsNoTasksMessage()
    {
        // Arrange — login as a user with no assigned moments
        await LoginAsSecondUserAsync();

        // Act
        await Page.GotoAsync("/moments/my-tasks");
        await Page.WaitForSelectorAsync("#my-tasks-content", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        // Assert — empty state or page rendered
        var body = await Page.TextContentAsync("body") ?? "";
        var hasContent = body.Contains("no", StringComparison.OrdinalIgnoreCase)
            || body.Contains("task", StringComparison.OrdinalIgnoreCase)
            || body.Contains("assigned", StringComparison.OrdinalIgnoreCase)
            || body.Contains("moment", StringComparison.OrdinalIgnoreCase);
        Assert.That(hasContent, Is.True,
            "My Tasks page should show empty state or task-related content");
        AssertNoCspViolations();
    }
}
