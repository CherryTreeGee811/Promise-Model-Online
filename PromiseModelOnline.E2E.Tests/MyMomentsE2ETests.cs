using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for MyMoments (assigned-to-me), MomentTasks, and ProjectMomentTasks controllers.</summary>
// Requirements: REQ_FUN_004 REQ_SEC_LOG_001
public class MyMomentsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views their assigned moments page")]
    public async Task ViewAssignedMoments_Authenticated_ShowsPage()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/moments/my-tasks");

        // Assert
        await Page.WaitForSelectorAsync("#my-tasks-content", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("My Tasks").Or.Contain("Assigned"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Assert
    public Task ViewAssignedMoments_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync("/moments/my-tasks");

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user creates a moment task via the moment detail page")]
    public async Task CreateMomentTaskViaDetailPage_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/moments/1");
        await Page.WaitForSelectorAsync(".moment-detail-card", new() { Timeout = 30000 });
        await Page.WaitForSelectorAsync("#add-moment-task-name", new() { Timeout = 10000 });
        await Page.FillAsync("#add-moment-task-name", "Browser E2E Task");
        await Page.ClickAsync("#add-moment-task-submit");

        // Assert
        await Page.WaitForSelectorAsync("tr[data-moment-task-id]", new() { Timeout = 10000 });
        var taskRows = await Page.Locator("tr[data-moment-task-id]").AllAsync();
        Assert.That(taskRows.Count, Is.GreaterThan(0));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from moment detail")]
    // Assert
    public Task ViewMomentDetail_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/moments/1");

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views moment detail page")]
    public async Task ViewMomentDetail_Authenticated_ShowsMoment()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/moments/1");

        // Assert
        await Page.WaitForSelectorAsync(".moment-detail-card", new() { Timeout = 30000 });
        var errorText = await Page.Locator("#error-text").InnerTextAsync();
        Assert.That(errorText, Is.Empty.Or.EqualTo(""));
        AssertNoCspViolations();
    }
}
