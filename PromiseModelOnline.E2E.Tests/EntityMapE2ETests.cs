using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for entity map (project hierarchy overview) and project detail.</summary>
// Requirements: REQ_FUN_003 REQ_SEC_LOG_001
public class EntityMapE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_003 happy path: Authenticated user views project entity map via graph page")]
    public async Task ViewEntityGraph_Authenticated_ShowsHierarchy()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync("#graph-viewport", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("Graph"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from graph page")]
    // Assert
    public Task ViewEntityGraph_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/graph");

    [Test]
    [Description("REQ_FUN_003 misuse: Read project via API bypass returns 200")]
    public async Task GetProjectDetail_BypassClient_ReturnsOk()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_FUN_003 misuse: Graph page renders safely (no XSS)")]
    public async Task GraphPage_RendersSafely_NoXss()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync("#graph-content", new() { Timeout = 15000 });
        var html = await Page.Locator("#graph-content").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated project API returns 401")]
    public async Task GetProjectDetail_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
