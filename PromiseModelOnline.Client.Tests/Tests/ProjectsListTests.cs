using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ProjectsListTests : PlaywrightTestBase
{
    [Test]
    public async Task ProjectList_LoadsAndDisplaysProject()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        var row = await WaitForSelectorAsync("#project-list-table-body tr");
        Assert.That(await row.TextContentAsync(), Does.Contain("Test Project"));
    }

    [Test]
    public async Task ProjectList_AuditLogButton_OpensHistoryPage()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        await WaitForSelectorAsync("#project-list-table-body tr");
        await ClickAsync(".audit-log-btn");

        var ends = await WaitForUrlContainsAsync("/pmo_test/seeded-project/history", 15);
        var historyList = await WaitForSelectorAsync("#audit-history-list");

        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/pmo_test/seeded-project/history"));
    }
}
