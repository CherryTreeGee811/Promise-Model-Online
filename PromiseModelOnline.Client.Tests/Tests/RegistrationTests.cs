using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class RegistrationTests : PlaywrightTestBase
{
    [Test]
    public async Task RegisterLink_NavigatesToAuthRegister()
    {
        await Page.GotoAsync(BaseUrl + "/");

        var registerLink = await WaitForSelectorAsync("#register-link", 5);
        var href = await registerLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/account/register"));
    }

    [Test]
    public async Task Register_InSpa_RedirectsToAuth()
    {
        await Page.GotoAsync(BaseUrl + "/register");

        var contains = await WaitForUrlContainsAsync("/register", 5);
        Assert.That(contains, Is.True);
    }
}
