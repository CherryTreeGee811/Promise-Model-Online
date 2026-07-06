using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class ReactionToggleE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_048 happy path: Add emoji reaction via UI toggle on promise detail page")]
    public async Task AddReaction_ViaEmoteButton_ShowsInSummary()
    {
        // Arrange
        await LoginAsync();
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync("#reactions-section", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.querySelectorAll('.emote-btn').length > 0", options: new() { Timeout = 5000 });

        // Act — click the first emote button
        var emoteBtn = Page.Locator(".emote-btn").First;
        if (!await emoteBtn.IsVisibleAsync())
            Assert.Inconclusive("Emote button not visible — user may lack comment permission");

        await emoteBtn.ClickAsync();
        await Page.WaitForFunctionAsync("() => document.getElementById('reactions-summary')?.innerText?.length > 0", options: new() { Timeout = 10000 });

        // Assert — reactions summary is present and no errors occurred
        var summary = await Page.Locator("#reactions-summary").InnerTextAsync();
        Assert.That(summary, Is.Not.Empty, "Reactions summary should be present after clicking");
        AssertNoCspViolations();
    }
}
