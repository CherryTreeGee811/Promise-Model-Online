using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for project permissions (share/invite page).</summary>
// Requirements: REQ_FUN_005 REQ_SEC_LOG_001
public class PermissionsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_005 happy path: Authenticated user views project share page")]
    public async Task ViewSharePage_Authenticated_ShowsPermissions()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/share");

        // Assert
        await Page.WaitForSelectorAsync("#permissions-section", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("Access").Or.Contain("Share"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login")]
    // Assert
    public Task ViewSharePage_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/share");

    [Test]
    [Description("REQ_FUN_005 misuse: Get my permission via API bypass returns level")]
    public async Task GetMyPermission_BypassClient_ReturnsLevel()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/my-permission", ajax: true);
        var text = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(text, Does.Contain("Edit").Or.Contain("Admin").Or.Contain("Owner"));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Permissions list loads via API bypass")]
    public async Task ListPermissions_Authenticated_BypassClient_ReturnsOk()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/permissions", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated permissions API returns 401")]
    public async Task ListPermissions_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_005 misuse: Share page renders permission data safely (no XSS)")]
    public async Task SharePage_RendersSafely_NoXss()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/share");

        // Assert
        await Page.WaitForSelectorAsync("#permissions-section", new() { Timeout = 30000 });
        var html = await Page.Locator("#permissions-section").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }
}
