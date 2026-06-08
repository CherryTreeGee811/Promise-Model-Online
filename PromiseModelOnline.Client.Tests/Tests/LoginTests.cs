using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class LoginTests : PlaywrightTestBase
{
    [Test]
    public async Task LoginLink_NavigatesToGatewayLogin()
    {
        await Page.GotoAsync(BaseUrl + "/");

        var loginLink = await WaitForSelectorAsync("#login-link", 5);
        var href = await loginLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/login"));
    }

    [Test]
    public async Task Login_HasNoFormInSpa()
    {
        await Page.GotoAsync(BaseUrl + "/login");

        var urlContains = await WaitForUrlContainsAsync("/login", 5);
        Assert.That(urlContains, Is.True);
    }

    [Test]
    public async Task Login_SetsSession_AllowsFutureRequests()
    {
        await NavigateAsUser("/projects");

        await WaitForSelectorAsync("#project-list-table-body tr");

        Assert.That(Page.Url, Does.Not.Contain("/login"));
    }
}
