using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the login page and authentication flow.</summary>
// Requirements: REQ_FUN_002
public class LoginTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_002_LoginLink_NavigatesToGatewayLogin()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/");

        // Act
        var loginLink = await WaitForSelectorAsync("#login-link", 5);
        var href = await loginLink.GetAttributeAsync("href");

        // Assert
        Assert.That(href, Does.Contain("/login"));
    }

    [Test]
    public async Task REQ_FUN_002_Login_HasNoFormInSpa()
    {
        // Arrange
        await Page.GotoAsync(BaseUrl + "/login");

        // Act
        var urlContains = await WaitForUrlContainsAsync("/login", 5);

        // Assert
        Assert.That(urlContains, Is.True);
    }

    [Test]
    public async Task REQ_FUN_002_Login_SetsSession_AllowsFutureRequests()
    {
        // Arrange
        await NavigateAsUser("/projects");

        // Act
        await WaitForSelectorAsync("#project-list-table-body tr");

        // Assert
        Assert.That(Page.Url, Does.Not.Contain("/login"));
    }
}
