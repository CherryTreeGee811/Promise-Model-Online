using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ChangePasswordTests : PlaywrightTestBase
{
    [Test]
    public async Task ChangePasswordLink_HrefPointsToAuth()
    {
        await SetSessionCookie("owner-session");

        await Page.Locator("#user-dropdown").ClickAsync();

        var changePwLink = await WaitForSelectorAsync("#change-password-link", 5);
        var href = await changePwLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/account/change-password"));
    }

    [Test]
    public async Task ChangePassword_Route_RedirectsToAuth()
    {
        await SetSessionCookie("owner-session");
        await NavigateSpaAsync("/change-password");

        var contains = await WaitForUrlContainsAsync("/change-password", 5);
        Assert.That(contains, Is.True);
    }
}
