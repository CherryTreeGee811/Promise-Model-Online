using Microsoft.Playwright;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
/// <summary>Playwright tests for privacy and terms of service pages.</summary>
// Requirements: REQ_NF_033 REQ_NF_034
public class LegalPagesTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_NF_033_PrivacyPage_LoadsSuccessfully()
    {
        // Act
        await Page.GotoAsync(BaseUrl + "/privacy", new PageGotoOptions { Timeout = 2000 });
        var heading = await WaitForSelectorAsync(".privacy-page h1", 2);
        var text = await heading.TextContentAsync();
        // Assert
        Assert.That(text, Does.Contain("Privacy Policy"));
    }

    [Test]
    public async Task REQ_NF_033_PrivacyPage_HasFooterLink()
    {
        // Act — page loaded by Setup() at /
        var link = Page.Locator("footer a[href='/privacy']");
        // Assert
        await Assertions.Expect(link).ToBeVisibleAsync();
    }

    [Test]
    public async Task REQ_NF_033_TosPage_LoadsSuccessfully()
    {
        // Act
        await Page.GotoAsync(BaseUrl + "/tos", new PageGotoOptions { Timeout = 2000 });
        var heading = await WaitForSelectorAsync(".privacy-page h1", 2);
        var text = await heading.TextContentAsync();
        // Assert
        Assert.That(text, Does.Contain("Terms of Service"));
    }

    [Test]
    public async Task REQ_NF_033_TosPage_HasFooterLink()
    {
        // Act — page loaded by Setup() at /
        var link = Page.Locator("footer a[href='/tos']");
        // Assert
        await Assertions.Expect(link).ToBeVisibleAsync();
    }

    [Test]
    public async Task REQ_NF_033_DeleteAccountPage_ShowsToAuthenticatedUser()
    {
        // Arrange
        await NavigateAsUser("/account/delete");
        // Act
        var heading = await WaitForSelectorAsync(".privacy-page h1", 2);
        var text = await heading.TextContentAsync();
        // Assert
        Assert.That(text, Does.Contain("My Data"));
    }

    [Test]
    public async Task REQ_NF_033_DeleteAccountPage_HasExportButton()
    {
        // Arrange
        await NavigateAsUser("/account/delete");
        // Act
        var btn = await WaitForSelectorAsync("#export-data-btn", 2);
        // Assert
        await Assertions.Expect(btn).ToBeVisibleAsync();
    }

    [Test]
    public async Task REQ_NF_033_DeleteAccountPage_HasDeleteForm()
    {
        // Arrange
        await NavigateAsUser("/account/delete");
        // Act
        var form = await WaitForSelectorAsync("#delete-account-form", 2);
        // Assert
        await Assertions.Expect(form).ToBeVisibleAsync();
    }
}
