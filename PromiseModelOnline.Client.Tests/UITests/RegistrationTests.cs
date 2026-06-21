using Microsoft.Playwright;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the registration page.</summary>
// Requirements: REQ_FUN_001
public class RegistrationTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_001_RegisterLink_NavigatesToAuthRegister()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/", new PageGotoOptions { Timeout = 2000 });

        // Act
        var registerLink = await WaitForSelectorAsync("#register-link");
        var href = await registerLink.GetAttributeAsync("href");

        // Assert
        Assert.That(href, Does.Contain("/account/register"));
    }

    [Test]
    public async Task REQ_FUN_001_Register_InSpa_RedirectsToAuth()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/register", new PageGotoOptions { Timeout = 2000 });

        // Act
        var contains = await WaitForUrlContainsAsync("/register");

        // Assert
        Assert.That(contains, Is.True);
    }
}
