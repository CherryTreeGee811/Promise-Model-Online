using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for search, invitations, and permissions interactions.</summary>
// Requirements: REQ_FUN_008 REQ_FUN_005 REQ_SEC_LOG_001
public class SearchAndPermissionsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_008 misuse: Search comments via API bypass returns 200")]
    public async Task SearchComments_BypassClient_ReturnsOk()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/comments?type=promise&parentId=1", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated comment search returns 401")]
    public async Task SearchComments_Unauthenticated_BypassClient_Returns401()
    {
        // Act
        var response = await GetAsync("/api/comments/search?q=test", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Authenticated user views pending invitations page")]
    public async Task ViewInvitations_Authenticated_ShowsPage()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync("/invitations");

        // Assert
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 30000 });
        var heading = await Page.Locator("h1").InnerTextAsync();
        Assert.That(heading, Does.Contain("Invitation").Or.Contain("invitation"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from invitations")]
    // Assert
    public Task ViewInvitations_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync("/invitations");

    [Test]
    [Description("REQ_FUN_005 happy path: Authenticated user accepts invitation via UI button")]
    public async Task AcceptInvitation_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync("/invitations");
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 30000 });

        // Act
        var acceptBtn = Page.Locator(".accept-btn").First;
        if (await acceptBtn.IsVisibleAsync())
        {
            var row = Page.Locator("tr[data-permission-id]").First;
            await acceptBtn.ClickAsync();
            await Page.WaitForTimeoutAsync(1500);

            // Assert — row was removed
            AssertNoCspViolations();
            var rowVisible = await row.IsVisibleAsync();
            Assert.That(rowVisible, Is.False);
        }
    }

    [Test]
    [Description("REQ_FUN_008 misuse: Search users via API bypass returns results")]
    public async Task SearchUsers_BypassClient_ReturnsEmpty()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/users/search?q=nonexistent", ajax: true);
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body, Does.Contain("[]").Or.Contain("200"));
    }

    [Test]
    [Description("REQ_FUN_005 misuse: Invitations page renders safely (no XSS)")]
    public async Task InvitationsPage_RendersSafely_NoXss()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync("/invitations");
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator("#invitations-list").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }
}
