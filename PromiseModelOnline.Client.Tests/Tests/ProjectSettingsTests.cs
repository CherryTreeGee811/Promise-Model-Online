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

    [Test]
    public async Task ProjectSettings_ViewFullAuditLog_OpensHistoryPage()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/pmo_test/seeded-project/settings");

        await ClickAsync("#project-audit-history-link");

        var ends = await WaitForUrlContainsAsync("/pmo_test/seeded-project/history", 15);
        var historyList = await WaitForSelectorAsync("#audit-history-list");

        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/pmo_test/seeded-project/history"));
    }
}
