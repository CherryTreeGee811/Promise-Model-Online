using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for reactions via entity detail pages — UI click + bypass client for misuse.</summary>
// Requirements: REQ_FUN_008 REQ_SEC_LOG_001
public class ReactionsE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_008 happy path: Authenticated user views reactions section on promise detail")]
    public async Task ViewReactionsOnPromise_Authenticated_ShowsSection()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");

        // Assert
        await Page.WaitForSelectorAsync("#reactions-section", new() { Timeout = 15000 });
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Authenticated user adds a reaction via emote button")]
    public async Task CreateReaction_Authenticated_Succeeds()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync(".emote-btn", new() { Timeout = 15000 });

        // Act
        await Page.ClickAsync(".emote-btn[data-emote='👍']");
        await Page.WaitForTimeoutAsync(1000);

        // Assert — verify the reactions-summary updated
        AssertNoCspViolations();
        var summary = await Page.Locator("#reactions-summary").InnerTextAsync();
        Assert.That(summary, Does.Contain("👍"));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Authenticated user reads reactions via API bypass")]
    public async Task GetReactions_BypassClient_ReturnsOk()
    {
        // Arrange
        await LoginAsync();

        // Act
        var response = await AuthGetAsync("/api/reactions?type=Promise&parentId=1", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from promise detail")]
    public async Task CreateReaction_Unauthenticated_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { stackItemType = "Promise", stackItemId = 1, emote = "thumbsup" });

        // Act
        var response = await PostJsonAsync("/api/reactions", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
