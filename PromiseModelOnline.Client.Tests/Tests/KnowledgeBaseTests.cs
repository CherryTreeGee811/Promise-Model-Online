using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class KnowledgeBaseTests : PlaywrightTestBase
{
    [Test]
    public async Task KnowledgeBase_ShowsSidebar()
    {
        await NavigateAsUser("/knowledge-base");

        var sidebar = await WaitForSelectorAsync("#navbar-kb", 10);

        Assert.That(await sidebar.IsVisibleAsync(), Is.True);
        Assert.That(await sidebar.TextContentAsync(), Does.Contain("Promise Stack KB"));

        var navLinks = await sidebar.Locator(".nav-link").AllAsync();
        Assert.That(navLinks.Count, Is.GreaterThanOrEqualTo(5));
    }

    [Test]
    public async Task KnowledgeBase_ShowsContent()
    {
        await NavigateAsUser("/knowledge-base");

        var kbContent = await WaitForSelectorAsync("#kb-content", 10);

        Assert.That(await kbContent.IsVisibleAsync(), Is.True);
        Assert.That(await kbContent.TextContentAsync(), Does.Contain("Promise Stack Overview"));
    }

    [Test]
    public async Task KnowledgeBase_Navigation_ScrollsToSection()
    {
        await NavigateAsUser("/knowledge-base");

        var sectionLink = await WaitForSelectorAsync("#navbar-kb a[href='#section6']", 10);
        await sectionLink.ClickAsync();

        var section = await WaitForSelectorAsync("#section6", 10);
        Assert.That(await section.IsVisibleAsync(), Is.True);
        Assert.That(await section.TextContentAsync(), Does.Contain("Moments"));
    }
}
