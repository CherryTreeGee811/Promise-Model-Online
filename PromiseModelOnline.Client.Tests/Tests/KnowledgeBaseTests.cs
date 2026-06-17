using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the knowledge base page.</summary>
// Requirements: REQ_FUN_041
public class KnowledgeBaseTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_041_KnowledgeBase_ShowsSidebar()
    {
        // Arrange
        await NavigateAsUser("/knowledge-base");
        // Act
        var sidebar = await WaitForSelectorAsync("#navbar-kb", 2);
        // Assert
        Assert.That(await sidebar.IsVisibleAsync(), Is.True);
        Assert.That(await sidebar.TextContentAsync(), Does.Contain("Promise Stack KB"));
        var navLinks = await sidebar.Locator(".nav-link").AllAsync();
        Assert.That(navLinks.Count, Is.GreaterThanOrEqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_041_KnowledgeBase_ShowsContent()
    {
        // Arrange
        await NavigateAsUser("/knowledge-base");
        // Act
        var kbContent = await WaitForSelectorAsync("#kb-content", 2);
        // Assert
        Assert.That(await kbContent.IsVisibleAsync(), Is.True);
        Assert.That(await kbContent.TextContentAsync(), Does.Contain("Promise Stack Overview"));
    }

    [Test]
    public async Task REQ_FUN_041_KnowledgeBase_Navigation_ScrollsToSection()
    {
        // Arrange
        await NavigateAsUser("/knowledge-base");
        // Act
        var sectionLink = await WaitForSelectorAsync("#navbar-kb a[href='#section6']", 2);
        await sectionLink.ClickAsync();
        // Assert
        var section = await WaitForSelectorAsync("#section6", 2);
        Assert.That(await section.IsVisibleAsync(), Is.True);
        Assert.That(await section.TextContentAsync(), Does.Contain("Moments"));
    }
}
