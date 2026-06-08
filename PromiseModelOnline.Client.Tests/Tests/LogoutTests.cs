using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class LogoutTests : PlaywrightTestBase
{
    [Test]
    public async Task LogoutLink_HrefPointsToGatewayLogout()
    {
        await NavigateAsUser("/");

        await Page.Locator("#user-dropdown").ClickAsync();

        var logoutLink = await WaitForSelectorAsync("#logout-link", 5);
        var href = await logoutLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/logout"));
    }
}
