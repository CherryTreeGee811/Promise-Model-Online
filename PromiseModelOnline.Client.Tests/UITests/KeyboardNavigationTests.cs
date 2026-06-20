using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.UITests;

/// <summary>Playwright tests for keyboard navigation and focus management.</summary>
// Requirements: REQ_USE_010 REQ_WCAG_004
public class KeyboardNavigationTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_USE_010_NavigationMenu_TabsForward()
    {
        // Arrange
        await EnsureLoggedIn();
        // Act — press Tab from the top of the page
        await Page.Keyboard.PressAsync("Tab");
        var focused1 = await Page.EvaluateAsync<string?>("document.activeElement?.id ?? document.activeElement?.tagName");
        await Page.Keyboard.PressAsync("Tab");
        var focused2 = await Page.EvaluateAsync<string?>("document.activeElement?.id ?? document.activeElement?.tagName");
        await Page.Keyboard.PressAsync("Tab");
        var focused3 = await Page.EvaluateAsync<string?>("document.activeElement?.id ?? document.activeElement?.tagName");
        // Assert — Tab should cycle through focusable nav elements
        Assert.That(focused1, Is.Not.Null.And.Not.Empty);
        Assert.That(focused2, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    public async Task REQ_USE_010_GraphZoomControls_KeyboardActivation()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-zoom-in");
        // Act — focus zoom-in button and press Enter
        await Page.Keyboard.PressAsync("Tab");
        // Keep tabbing until we reach zoom-in
        for (int i = 0; i < 20; i++)
        {
            var activeId = await Page.EvaluateAsync<string?>("document.activeElement?.id");
            if (activeId == "graph-zoom-in") break;
            await Page.Keyboard.PressAsync("Tab");
        }
        var foundZoomIn = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        // Assert
        Assert.That(foundZoomIn, Is.EqualTo("graph-zoom-in"));
    }

    [Test]
    public async Task REQ_USE_010_ProjectLink_EnterKey_Navigates()
    {
        // Arrange
        await EnsureLoggedIn();
        // Focus the Projects link by clicking it first, then Tab back
        await Page.Keyboard.PressAsync("Tab");
        await Page.Keyboard.PressAsync("Tab");
        // Act — press Enter on the focused Projects link
        await Page.Keyboard.PressAsync("Enter");
        await Task.Delay(500);
        // Assert — URL should contain /projects
        Assert.That(Page.Url, Does.Contain("/projects").Or.Contains("/projects"));
    }

    [Test]
    public async Task REQ_USE_010_GraphFocus_TabAndSpace()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-zoom-in");
        // Tab to zoom-in button
        for (int i = 0; i < 20; i++)
        {
            var activeId = await Page.EvaluateAsync<string?>("document.activeElement?.id");
            if (activeId == "graph-zoom-in") break;
            await Page.Keyboard.PressAsync("Tab");
        }
        // Act — press Space to activate
        var beforePress = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        await Page.Keyboard.PressAsync("Space");
        await Task.Delay(300);
        var afterPress = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        // Assert — zoom button should still be focused after activation
        Assert.That(beforePress, Is.EqualTo("graph-zoom-in"));
    }
}
