using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class LegalPagesTests : PlaywrightTestBase
{
    [Test]
    public async Task PrivacyPage_LoadsSuccessfully()
    {
        await Page.GotoAsync(BaseUrl + "/privacy");
        var heading = await WaitForSelectorAsync(".privacy-page h1", 10);
        var text = await heading.TextContentAsync();
        Assert.That(text, Does.Contain("Privacy Policy"));
    }

    [Test]
    public async Task PrivacyPage_HasFooterLink()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var link = Page.Locator("footer a[href='/privacy']");
        await Assertions.Expect(link).ToBeVisibleAsync();
    }

    [Test]
    public async Task TosPage_LoadsSuccessfully()
    {
        await Page.GotoAsync(BaseUrl + "/tos");
        var heading = await WaitForSelectorAsync(".privacy-page h1", 10);
        var text = await heading.TextContentAsync();
        Assert.That(text, Does.Contain("Terms of Service"));
    }

    [Test]
    public async Task TosPage_HasFooterLink()
    {
        await Page.GotoAsync(BaseUrl + "/");
        var link = Page.Locator("footer a[href='/tos']");
        await Assertions.Expect(link).ToBeVisibleAsync();
    }

    [Test]
    public async Task DeleteAccountPage_ShowsToAuthenticatedUser()
    {
        await NavigateAsUser("/account/delete");
        var heading = await WaitForSelectorAsync(".privacy-page h1", 10);
        var text = await heading.TextContentAsync();
        Assert.That(text, Does.Contain("My Data"));
    }

    [Test]
    public async Task DeleteAccountPage_HasExportButton()
    {
        await NavigateAsUser("/account/delete");
        var btn = await WaitForSelectorAsync("#export-data-btn", 10);
        await Assertions.Expect(btn).ToBeVisibleAsync();
    }

    [Test]
    public async Task DeleteAccountPage_HasDeleteForm()
    {
        await NavigateAsUser("/account/delete");
        var form = await WaitForSelectorAsync("#delete-account-form", 10);
        await Assertions.Expect(form).ToBeVisibleAsync();
    }
}
