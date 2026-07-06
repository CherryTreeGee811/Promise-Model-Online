using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for reading seeded promises via graph and detail pages.</summary>
// Requirements: REQ_FUN_004 REQ_SEC_LOG_001
public class PromiseCreationE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views seeded promises in graph")]
    public async Task ViewSeededPromises_Authenticated_ShowsGraph()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");

        // Assert
        await Page.WaitForSelectorAsync(".graph-node", new() { Timeout = 15000 });
        var nodeCount = await Page.Locator(".graph-node").CountAsync();
        Assert.That(nodeCount, Is.GreaterThan(0));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user reads promise statement from detail page")]
    public async Task ReadSeededPromise_Authenticated_ShowsStatement()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync(".promise-detail-card h2", new() { Timeout = 15000 });

        // Assert
        AssertNoCspViolations();
        var statement = await Page.Locator(".promise-detail-card h2").InnerTextAsync();
        Assert.That(statement, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from promise detail")]
    // Assert
    public Task ReadSeededPromise_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/promises/1");

    [Test]
    [Description("REQ_FUN_004 misuse: Read promise via API bypass returns 200")]
    public async Task ReadSeededPromise_BypassClient_Returns200()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/promises/1", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated promise API returns 401")]
    public async Task ReadSeededPromise_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/1", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_047 misuse: Promise detail page renders statement safely (no XSS)")]
    public async Task PromiseStatement_RendersSafely_NoXss()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync(".promise-detail-card h2", new() { Timeout = 15000 });

        // Act
        var html = await Page.Locator(".promise-detail-card").InnerHTMLAsync();

        // Assert — statement is rendered as text, not raw HTML
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }
}
