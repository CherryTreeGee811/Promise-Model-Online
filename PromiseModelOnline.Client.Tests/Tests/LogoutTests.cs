using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the logout flow.</summary>
// Requirements: REQ_INT_015
public class LogoutTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_INT_015_LogoutLink_HrefPointsToGatewayLogout()
    {
        // Arrange
        await NavigateAsUser("/");

        // Act
        await Page.Locator("#user-dropdown").ClickAsync();

        var logoutLink = await WaitForSelectorAsync("#logout-link", 5);
        var href = await logoutLink.GetAttributeAsync("href");

        // Assert
        Assert.That(href, Does.Contain("/logout"));
    }
}
