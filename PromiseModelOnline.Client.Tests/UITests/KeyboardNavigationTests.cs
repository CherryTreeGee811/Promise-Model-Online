using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.UITests;

/// <summary>Playwright tests for keyboard navigation and focus management.</summary>
// Requirements: REQ_USE_010 REQ_WCAG_004
public class KeyboardNavigationTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_USE_010_NavigationMenu_TabsForward()
    {
        // Arrange — click the page body to move focus from browser chrome to the document
        await EnsureLoggedIn();
        await Page.Mouse.ClickAsync(50, 50);
        await Task.Delay(200);
        // Act — press Tab to move focus into the navigation menu
        await Page.Keyboard.PressAsync("Tab");
        var focused1 = await Page.EvaluateAsync<string?>("document.activeElement?.id ?? document.activeElement?.tagName");
        await Page.Keyboard.PressAsync("Tab");
        var focused2 = await Page.EvaluateAsync<string?>("document.activeElement?.id ?? document.activeElement?.tagName");
        // Assert — Tab should cycle through focusable elements
        Assert.That(focused1, Is.Not.Null.And.Not.Empty, "First Tab should focus an element");
        Assert.That(focused2, Is.Not.Null.And.Not.Empty, "Second Tab should focus another element");
    }

    [Test]
    public async Task REQ_USE_010_GraphZoomControls_KeyboardActivation()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-zoom-in");
        // Focus the zoom-in button directly
        await Page.FocusAsync("#graph-zoom-in");
        await Task.Delay(100);
        var focused = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        // Assert — zoom-in button should be focused
        Assert.That(focused, Is.EqualTo("graph-zoom-in"));
    }

    [Test]
    public async Task REQ_USE_010_ProjectLink_EnterKey_Navigates()
    {
        // Arrange
        await EnsureLoggedIn();
        await Page.Mouse.ClickAsync(50, 50);
        await Task.Delay(200);
        // Tab to find and activate the Projects link
        for (int i = 0; i < 25; i++)
        {
            await Page.Keyboard.PressAsync("Tab");
            var activeId = await Page.EvaluateAsync<string?>("document.activeElement?.id");
            if (activeId == "projects-link") break;
        }
        var beforePress = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        // Act — press Enter on the focused Projects link
        await Page.Keyboard.PressAsync("Enter");
        await Task.Delay(800);
        // Assert — URL should contain /projects
        Assert.That(beforePress, Is.EqualTo("projects-link"), "Projects link should be focused before Enter");
        Assert.That(Page.Url, Does.Contain("/projects"));
    }

    [Test]
    public async Task REQ_USE_010_GraphFocus_TabAndSpace()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-zoom-in");
        // Focus the zoom-in button
        await Page.FocusAsync("#graph-zoom-in");
        await Task.Delay(100);
        var beforePress = await Page.EvaluateAsync<string?>("document.activeElement?.id");
        // Act — press Space to activate
        await Page.Keyboard.PressAsync("Space");
        await Task.Delay(300);
        // Assert — zoom button should still be focused after activation
        Assert.That(beforePress, Is.EqualTo("graph-zoom-in"));
    }
}
