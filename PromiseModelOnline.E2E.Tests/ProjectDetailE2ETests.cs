using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for project detail, iterations, strides, graph, user profile.</summary>
// Requirements: REQ_FUN_001 REQ_FUN_003 REQ_FUN_006 REQ_SEC_LOG_001
public class ProjectDetailE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_001 happy path: Authenticated user views project backlog page")]
    public async Task ViewProjectDetail_Authenticated_ShowsStrides()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}");

        // Assert
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Backlog"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Act & Assert
    public Task ViewProjectDetail_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}");

    [Test]
    [Description("REQ_FUN_001 happy path: Authenticated user views user preferences")]
    public async Task ViewUserPreferences_Authenticated_ShowsPage()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/preferences");

        // Assert
        await Page.WaitForSelectorAsync("h1", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Preferences"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Act & Assert
    public Task ViewUserPreferences_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync("/preferences");

    [Test]
    [Description("REQ_FUN_006 happy path: Authenticated user views iteration history")]
    public async Task ViewIterations_Authenticated_ShowsIterations()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/iterations");

        // Assert
        await Page.WaitForSelectorAsync("#iterations-view", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Iteration"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Act & Assert
    public Task ViewIterations_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/iterations");

    [Test]
    [Description("REQ_FUN_006 happy path: Authenticated user views backlog/strides")]
    public async Task ViewStrides_Authenticated_ShowsBacklog()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/strides");

        // Assert
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Backlog"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Act & Assert
    public Task ViewStrides_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/strides");

    [Test]
    [Description("REQ_FUN_003 happy path: Authenticated user views project graph")]
    public async Task ViewProjectGraph_Authenticated_ShowsGraph()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync("#graph-content", new() { Timeout = 30000 });
        Assert.That(await Page.Locator("h1").InnerTextAsync(), Does.Contain("Graph"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Act & Assert
    public Task ViewProjectGraph_Unauthenticated_RedirectsToLogin() =>
        GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/graph");
}
