using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the home page.</summary>
// Requirements: REQ_SYS_021
public class HomePageTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_SYS_021_HomePage_ShowsTitle()
    {
        // Act
        await Page.GotoAsync(BaseUrl + "/");
        var title = await WaitForSelectorAsync(".home-page h1", 5);
        var text = await title.TextContentAsync();
        // Assert
        Assert.That(text, Does.Contain("Align Your Teams"));
    }

    [Test]
    public async Task REQ_SYS_021_HomePage_AnonymousUser_ShowsLoginAndRegisterLinks()
    {
        // Act
        await Page.GotoAsync(BaseUrl + "/");
        var ctaArea = await WaitForSelectorAsync("#home-cta-area", 5);
        var loginLink = ctaArea.Locator("a[href='/login']");
        var registerLink = ctaArea.Locator("a[href='/account/register']");
        // Assert
        Assert.That(await loginLink.IsVisibleAsync(), Is.True);
        Assert.That(await loginLink.TextContentAsync(), Does.Contain("Login"));
        Assert.That(await registerLink.IsVisibleAsync(), Is.True);
        Assert.That(await registerLink.TextContentAsync(), Does.Contain("Register"));
    }

    [Test]
    public async Task REQ_SYS_021_HomePage_AuthenticatedUser_ShowsProjectAndTaskLinks()
    {
        // Arrange
        await NavigateAsUser("/");
        // Act & Assert
        await WaitForSelectorAsync("#home-cta-area a[href='/projects']", 10);
        await WaitForSelectorAsync("#home-cta-area a[href='/moments/my-tasks']", 5);
        await WaitForSelectorAsync("#home-cta-area a[href='/knowledge-base']", 5);
    }

    [Test]
    public async Task REQ_SYS_021_HomePage_ShowsStackCards()
    {
        // Act
        await Page.GotoAsync(BaseUrl + "/");
        await WaitForSelectorAsync(".home-stack-card--promise", 5);
        await WaitForSelectorAsync(".home-stack-card--epic", 5);
        await WaitForSelectorAsync(".home-stack-card--journey", 5);
        await WaitForSelectorAsync(".home-stack-card--flow", 5);
        await WaitForSelectorAsync(".home-stack-card--moment", 5);
        // Assert
        Assert.That(await GetTextContentAsync(".home-stack-card--promise h3"), Is.EqualTo("Promise"));
        Assert.That(await GetTextContentAsync(".home-stack-card--moment h3"), Is.EqualTo("Moment"));
    }
}
