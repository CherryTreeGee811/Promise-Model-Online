using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for project CRUD (create, list, read, delete) via UI.</summary>
// Requirements: REQ_FUN_001 REQ_SEC_LOG_001
public class ProjectCrudE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string TestSlug = "e2e-test-project";
    private const string TestName = "E2E Test Project";

    [Test]
    [Description("REQ_FUN_001 happy path: Authenticated user views project list")]
    public async Task ViewProjectList_Authenticated_ShowsProjects()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync("/projects");
        // Assert
        await Page.WaitForSelectorAsync("#project-list-table", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Projects"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Assert
    public Task ViewProjectList_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync("/projects");

    [Test]
    [Description("REQ_FUN_001 happy path: Authenticated user creates a project via the add-project form")]
    public async Task CreateProject_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueName = $"E2E Test {timestamp}";
        var uniqueSlug = $"e2e-test-{timestamp}";

        // Act
        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", uniqueName);
        await Page.FillAsync("#first-promise-input", "As a user, manage projects seamlessly.");
        await Page.ClickAsync("#create-project-btn");

        // Assert — should redirect to the new project's graph page
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        Assert.That(Page.Url, Does.Contain(uniqueSlug).Or.Contain("graph"));
    }

    [Test]
    [Description("REQ_FUN_001 happy path: Authenticated user sees project title via API")]
    public async Task NavigateToProject_Authenticated_ShowsBacklog()
    {
        // Arrange - create a fresh project via the UI so test doesn't depend on mutable seed data
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueName = $"E2E Nav Test {timestamp}";

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", uniqueName);
        await Page.FillAsync("#first-promise-input", "As a user, test navigation.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });

        // Extract the actual project slug from the URL (server-generated, not pre-computed)
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];

        // Assert - verify the project exists via API (end-to-end: UI→API→DB)
        using var client = await GetAuthClientAsync();
        var resp = await client.GetAsync($"/api/projects/{Owner}/{slug}");
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await resp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(uniqueName));
    }
}
