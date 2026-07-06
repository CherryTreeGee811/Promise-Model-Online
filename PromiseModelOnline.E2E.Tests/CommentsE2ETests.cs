using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for comments — create and view via promise detail page.</summary>
// Requirements: REQ_FUN_008 REQ_SEC_LOG_001
public class CommentsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_008 happy path: Authenticated user creates a comment via promise detail page")]
    public async Task CreateCommentViaPromiseDetail_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync("#comment-textarea", new() { Timeout = 30000 });
        var suffix = Guid.NewGuid().ToString("N");
        var uniqueText = $"Browser-based E2E comment {suffix}";

        // Act
        await Page.FillAsync("#comment-textarea", uniqueText);
        await Page.ClickAsync("#comment-form button[type='submit']");

        // Assert — wait for the AJAX POST to complete (NetworkIdle) before checking DOM
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle, new() { Timeout = 15000 });
        var newComment = Page.Locator(".comment-text", new() { HasText = suffix });
        await Assertions.Expect(newComment).ToBeVisibleAsync(new() { Timeout = 10000 });
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Authenticated user views comments on a promise")]
    public async Task ViewCommentsOnPromise_Authenticated_ShowsCommentsSection()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");

        // Assert
        await Page.WaitForSelectorAsync("#comments-list", new() { Timeout = 30000 });
        var heading = await Page.Locator("#promise-comments h3").InnerTextAsync();
        Assert.That(heading, Does.Contain("Comments"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from promise detail")]
    // Assert
    public Task ViewPromiseDetail_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/promises/1");

    [Test]
    [Description("REQ_FUN_008 misuse: Create comment via API bypass returns 201")]
    public async Task CreateComment_BypassClient_Returns201()
    {
        // Arrange
        await LoginAsync();
        var json = System.Text.Json.JsonSerializer.Serialize(new { text = "API bypass comment", parentType = "Promise", parentId = 1 });

        // Act
        var response = await AuthPostJsonAsync("/api/comments", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated comment API returns 401")]
    public async Task CreateComment_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { text = "xss", parentType = "Promise", parentId = 1 });

        // Act
        var response = await PostJsonAsync("/api/comments", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
