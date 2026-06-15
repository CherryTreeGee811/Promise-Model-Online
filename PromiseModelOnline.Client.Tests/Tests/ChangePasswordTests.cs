using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the change password flow.</summary>
// Requirements: REQ_USE_012
public class ChangePasswordTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_USE_012_ChangePasswordLink_HrefPointsToAuth()
    {
        // Arrange
        await NavigateAsUser("/");
        // Act
        await Page.Locator("#user-dropdown").ClickAsync();
        var changePwLink = await WaitForSelectorAsync("#change-password-link", 5);
        var href = await changePwLink.GetAttributeAsync("href");
        // Assert
        Assert.That(href, Does.Contain("/account/change-password"));
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_Route_RedirectsToAuth()
    {
        // Arrange
        await NavigateAsUser("/");
        // Act
        await Page.GotoAsync(BaseUrl + "/account/change-password");
        // Assert
        var contains = await WaitForUrlContainsAsync("/change-password", 5);
        Assert.That(contains, Is.True);
    }
}
