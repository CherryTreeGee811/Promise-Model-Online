using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for AuditEvents and DeadlineNotificationRuns controllers.</summary>
// Requirements: REQ_FUN_006 REQ_SEC_LOG_001
public class AuditEventsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_006 happy path: Authenticated user views project audit history page")]
    public async Task ViewProjectAuditHistory_Authenticated_ShowsActivity()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/history");

        // Assert
        await Page.WaitForSelectorAsync("#audit-history-list", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("activity").IgnoreCase);
        Assert.That(await Page.Locator("#error-text").InnerTextAsync(), Is.Empty.Or.EqualTo(""));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated audit history API returns 401")]
    public async Task ViewProjectAuditHistory_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/history", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_006 misuse: Trigger deadline notifications via API bypass returns 204")]
    public async Task TriggerDeadlineNotifications_BypassClient_Returns204()
    {
        // Arrange
        await LoginAsync();

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        var response = await AuthPostJsonAsync("/api/deadline-notification-runs", "{}");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated deadline notification API returns 401")]
    public async Task TriggerDeadlineNotifications_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/deadline-notification-runs", "{}", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Authenticated user sees graph data in browser")]
    public async Task FetchProjectGraphData_Authenticated_ShowsNodes()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync("#graph-content .graph-node", new() { Timeout = 15000 });
        var nodeCount = await Page.Locator("#graph-content .graph-node").CountAsync();
        Assert.That(nodeCount, Is.GreaterThan(0));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_006 misuse: Audit history page renders safely (no XSS)")]
    public async Task AuditHistoryPage_RendersSafely_NoXss()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/history");

        // Assert
        await Page.WaitForSelectorAsync("#audit-history-list", new() { Timeout = 30000 });
        var html = await Page.Locator("#audit-history-list").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }
}
