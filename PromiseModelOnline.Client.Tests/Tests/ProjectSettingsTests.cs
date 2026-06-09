using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ProjectSettingsTests : PlaywrightTestBase
{
    [Test]
    public async Task ProjectSettings_DeleteProject_RequiresConfirmationAndRedirects()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/pmo_test/seeded-project/settings");

        var confirmationTextEl = await WaitForSelectorAsync("#project-delete-confirmation-text", 20);
        var confirmationPhrase = await confirmationTextEl.TextContentAsync() ?? string.Empty;

        var input = await WaitForSelectorAsync("#project-delete-confirmation-input");
        await input.FillAsync(confirmationPhrase);

        await ClickAsync("#delete-project-btn");

        var ends = await WaitForUrlContainsAsync("/projects", 15);
        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/projects"));
    }

}
